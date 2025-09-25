/**
 * Snapshot generator for LLM / AI hot repositories.
 * Keywords: configurable via HOT_TOPICS env or defaults.
 * Writes: data/latest.json + data/snapshots/YYYY-MM-DD.json
 */
import fs from 'fs';
import path from 'path';

const token = process.env.GITHUB_TOKEN;
if(!token){
  console.error('GITHUB_TOKEN missing (set as secret in workflow)');
  process.exit(1);
}

// Default 5 hot topics (override by HOT_TOPICS="topic1,topic2")
const topics = (process.env.HOT_TOPICS || 'llm,agent,rag,tts,voice').split(',').map(s=>s.trim()).filter(Boolean);
const days = parseInt(process.env.WINDOW_DAYS||'30',10);
const minStars = parseInt(process.env.MIN_STARS||'50',10);

const now = new Date();
const today = now.toISOString().slice(0,10);
const since = new Date(); since.setDate(since.getDate()-days);
const sinceIso = since.toISOString().slice(0,10);

async function gh(url){
  const res = await fetch(url, { headers:{
    Accept:'application/vnd.github+json',
    Authorization:`Bearer ${token}`,
    'X-GitHub-Api-Version':'2022-11-28'
  }});
  if(!res.ok){
    throw new Error(res.status+': '+await res.text());
  }
  return res.json();
}

async function run(){
  const collected = new Map();
  for(const t of topics){
    const q = encodeURIComponent(`${t} created:${sinceIso}..${today} stars:>=${minStars} in:name,description,readme`);
    const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=40`;
    console.log('Query', t, url);
    try{
      const data = await gh(url);
      (data.items||[]).forEach(r=>{
        if(!collected.has(r.id)){
          collected.set(r.id, {
            id:r.id,
            full_name:r.full_name,
            name:r.name,
            html_url:r.html_url,
            description:r.description,
            stargazers_count:r.stargazers_count,
            language:r.language,
            topics:r.topics||[],
            created_at:r.created_at,
            updated_at:r.updated_at
          });
        }
      });
    }catch(e){
      console.error('Failed', t, e.message);
    }
    await new Promise(r=>setTimeout(r, 1200)); // gentle pacing
  }

  const repos = Array.from(collected.values())
    .sort((a,b)=>b.stargazers_count-a.stargazers_count)
    .slice(0,80);

  const outDir = path.join(process.cwd(), 'data');
  const snapDir = path.join(outDir,'snapshots');
  fs.mkdirSync(outDir,{recursive:true});
  fs.mkdirSync(snapDir,{recursive:true});

  const latestPayload = { generated_at: now.toISOString(), window_days: days, keywords: topics, count: repos.length, repos };
  fs.writeFileSync(path.join(outDir,'latest.json'), JSON.stringify(latestPayload,null,2));
  fs.writeFileSync(path.join(snapDir, today+'.json'), JSON.stringify(repos,null,2));
  console.log('Wrote', repos.length, 'repos');
}

run().catch(e=>{ console.error(e); process.exit(1); });

// JSDOS: 贪食蛇游戏后端服务器
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'gameData.json');

// 确保数据目录存在
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        members: [{
            id: 'admin',
            username: 'admin',
            password: 'password',
            role: 'admin',
            registerDate: new Date().toISOString()
        }],
        allSnakeScores: [],
        snakeScores: [],
        gameSettings: {
            difficulty: 'medium',
            maxScores: 10
        }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据文件出错:', error);
        return {
            members: [],
            allSnakeScores: [],
            snakeScores: [],
            gameSettings: { difficulty: 'medium', maxScores: 10 }
        };
    }
}

// 写入数据
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入数据文件出错:', error);
        return false;
    }
}

// 更新排行榜
function updateTopScores() {
    const data = readData();
    
    // 按分数降序排序
    data.allSnakeScores.sort((a, b) => b.score - a.score);
    
    // 只保留前10名
    data.snakeScores = data.allSnakeScores.slice(0, 10);
    
    writeData(data);
}

// API路由
// 用户登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const data = readData();
    const member = data.members.find(m => m.username === username && m.password === password);
    
    if (member) {
        // 不返回密码
        const { password, ...userInfo } = member;
        return res.json({ success: true, user: userInfo });
    } else {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
});

// 获取会员列表 (仅管理员)
app.get('/api/members', (req, res) => {
    const { username, role } = req.query;
    
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限访问' });
    }
    
    const data = readData();
    // 不返回密码
    const members = data.members.map(({ password, ...rest }) => rest);
    res.json({ success: true, members });
});

// 添加/编辑会员 (仅管理员)
app.post('/api/members', (req, res) => {
    const { adminUsername, adminRole, member } = req.body;
    
    if (adminRole !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限执行此操作' });
    }
    
    const data = readData();
    
    // 编辑现有会员
    if (member.id) {
        const index = data.members.findIndex(m => m.id === member.id);
        if (index !== -1) {
            data.members[index] = { ...data.members[index], ...member };
        } else {
            return res.status(404).json({ success: false, message: '找不到指定的会员' });
        }
    } 
    // 添加新会员
    else {
        // 检查用户名是否已存在
        if (data.members.some(m => m.username === member.username)) {
            return res.status(400).json({ success: false, message: '用户名已存在' });
        }
        
        member.id = Date.now().toString();
        member.registerDate = new Date().toISOString();
        data.members.push(member);
    }
    
    if (writeData(data)) {
        res.json({ success: true, message: '会员保存成功' });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 删除会员 (仅管理员)
app.delete('/api/members/:id', (req, res) => {
    const { adminUsername, adminRole } = req.query;
    const memberId = req.params.id;
    
    if (adminRole !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限执行此操作' });
    }
    
    // 不允许删除管理员自己
    if (memberId === 'admin') {
        return res.status(400).json({ success: false, message: '不能删除主管理员账户' });
    }
    
    const data = readData();
    const initialLength = data.members.length;
    data.members = data.members.filter(member => member.id !== memberId);
    
    if (data.members.length === initialLength) {
        return res.status(404).json({ success: false, message: '找不到指定的会员' });
    }
    
    if (writeData(data)) {
        res.json({ success: true, message: '会员删除成功' });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 获取分数记录
app.get('/api/scores', (req, res) => {
    const data = readData();
    res.json({ success: true, scores: data.snakeScores });
});

// 获取用户个人分数记录
app.get('/api/scores/user/:username', (req, res) => {
    const { username } = req.params;
    const data = readData();
    
    const userScores = data.allSnakeScores.filter(score => score.username === username);
    res.json({ success: true, scores: userScores });
});

// 保存新分数
app.post('/api/scores', (req, res) => {
    const { username, score } = req.body;
    
    if (!username) {
        return res.status(400).json({ success: false, message: '未提供用户名' });
    }
    
    const data = readData();
    
    // 验证用户是否存在
    const userExists = data.members.some(member => member.username === username);
    if (!userExists) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 添加新分数记录
    const newScoreRecord = {
        id: Date.now().toString(),
        username,
        score,
        date: new Date().toISOString()
    };
    
    data.allSnakeScores.push(newScoreRecord);
    
    // 更新排行榜
    data.allSnakeScores.sort((a, b) => b.score - a.score);
    data.snakeScores = data.allSnakeScores.slice(0, data.gameSettings.maxScores || 10);
    
    if (writeData(data)) {
        res.json({ 
            success: true, 
            message: '分数保存成功',
            newScore: newScoreRecord,
            topScores: data.snakeScores
        });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 删除分数记录
app.delete('/api/scores/:id', (req, res) => {
    const { username } = req.query;
    const scoreId = req.params.id;
    
    const data = readData();
    
    // 找到要删除的分数记录
    const scoreRecord = data.allSnakeScores.find(s => s.id === scoreId);
    
    // 验证权限：只有管理员或分数所有者可以删除
    const isAdmin = data.members.some(m => m.username === username && m.role === 'admin');
    if (!scoreRecord || (scoreRecord.username !== username && !isAdmin)) {
        return res.status(403).json({ success: false, message: '没有权限删除此记录' });
    }
    
    // 删除记录
    data.allSnakeScores = data.allSnakeScores.filter(s => s.id !== scoreId);
    
    // 更新排行榜
    data.allSnakeScores.sort((a, b) => b.score - a.score);
    data.snakeScores = data.allSnakeScores.slice(0, data.gameSettings.maxScores || 10);
    
    if (writeData(data)) {
        res.json({ success: true, message: '分数记录删除成功' });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 获取游戏设置
app.get('/api/settings', (req, res) => {
    const data = readData();
    res.json({ success: true, settings: data.gameSettings });
});

// 更新游戏设置 (仅管理员)
app.post('/api/settings', (req, res) => {
    const { username, role, settings } = req.body;
    
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限执行此操作' });
    }
    
    const data = readData();
    data.gameSettings = { ...data.gameSettings, ...settings };
    
    // 如果修改了maxScores，更新排行榜
    if (settings.maxScores) {
        data.snakeScores = data.allSnakeScores
            .sort((a, b) => b.score - a.score)
            .slice(0, settings.maxScores);
    }
    
    if (writeData(data)) {
        res.json({ success: true, message: '设置保存成功', settings: data.gameSettings });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 导出所有数据 (仅管理员)
app.get('/api/export', (req, res) => {
    const { username, role } = req.query;
    
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限执行此操作' });
    }
    
    const data = readData();
    data.exportDate = new Date().toISOString();
    
    res.json(data);
});

// 导入数据 (仅管理员)
app.post('/api/import', (req, res) => {
    const { username, role, data: importData } = req.body;
    
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: '没有权限执行此操作' });
    }
    
    if (!importData || !importData.members || !importData.allSnakeScores) {
        return res.status(400).json({ success: false, message: '无效的数据格式' });
    }
    
    // 确保至少有一个管理员账户
    if (!importData.members.some(m => m.role === 'admin')) {
        return res.status(400).json({ success: false, message: '导入的数据必须包含至少一个管理员账户' });
    }
    
    if (writeData(importData)) {
        res.json({ success: true, message: '数据导入成功' });
    } else {
        res.status(500).json({ success: false, message: '保存数据时出错' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 
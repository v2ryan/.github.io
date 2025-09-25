#!/usr/bin/env python
"""
Static PDF -> prices.json generator

Heuristic parser that scans all PDF files under ../pdf/ and extracts lens price rows.

Because we don't know your exact PDF layout, this uses pattern guesses you can tune:
- Looks for lines containing an index value like 1.5 / 1.56 / 1.6 / 1.67 / 1.74
- Tries to capture: series, subseries, index, coating, price
- Detects '海外' token to set overseas = true
- Captures page number
- Attempts to find effective date lines (e.g. 'Effective', '生效')

Edit the REGEX_PATTERNS list or the normalize_line() logic for better accuracy.

Usage:
  python scripts/generate_prices.py

Output written to: prices.json (at repo web root)

If PyPDF2 isn't installed, install with:
  pip install PyPDF2

"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import date

# Optional: try pdfminer as secondary extractor (installed only if user adds it)
try:
    from pdfminer.high_level import extract_text  # type: ignore
    PDFMINER_AVAILABLE = True
except Exception:  # pragma: no cover
    PDFMINER_AVAILABLE = False

try:
    from PyPDF2 import PdfReader  # type: ignore
except ImportError:
    print("[ERROR] PyPDF2 not installed. Run: pip install PyPDF2", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent  # .github.io/
PDF_DIR = ROOT / 'pdf'
OUT_PATH = ROOT / 'prices.json'

INDEX_VALUES = ["1.5", "1.53", "1.56", "1.6", "1.61", "1.67", "1.71", "1.74", "1.8"]
INDEX_RE = r"(?:" + "|".join(re.escape(v) for v in INDEX_VALUES) + r")"

# Heuristic row patterns (try them in order)
# Allow Chinese, plus signs, parentheses, hyphen, slash
CH = "\u4e00-\u9fff"
WORD = f"A-Za-z0-9{CH}"
REGEX_PATTERNS = [
    re.compile(rf"^(?P<series>[{WORD}]+)\s+(?P<subseries>[{WORD}+\-/()]*)\s+(?P<index>{INDEX_RE})\s+(?P<coating>[{WORD}+()\-/]+)\s+(?:HK\$|HKD|H\$)?(?P<price>\d{{2,6}})"),
    re.compile(rf"^(?P<series>[{WORD}]+)\s+(?P<index>{INDEX_RE})\s+(?P<coating>[{WORD}+()\-/]+)\s+(?:HK\$|HKD|H\$)?(?P<price>\d{{2,6}})"),
]

EFFECTIVE_DATE_RE = re.compile(r"(Effective\s+Date|生效[日日期]?)[^0-9]*(?P<date>\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})")
DATE_NORMALIZE_RE = re.compile(r"[./]")

@dataclass
class PriceRow:
    series: str
    subseries: str
    index: str
    coating: str
    price_hkd: int
    overseas: bool
    source_file: str
    page: int
    effective_date: str | None
    starred: bool = False  # denotes original price had asterisks (***), semantics TBD


def normalize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def try_parse_line(line: str):
    for rx in REGEX_PATTERNS:
        m = rx.match(line)
        if m:
            gd = m.groupdict()
            return {
                "series": gd.get("series", "").upper(),
                "subseries": gd.get("subseries", ""),
                "index": gd.get("index", ""),
                "coating": gd.get("coating", ""),
                "price_hkd": int(gd.get("price", 0)),
            }
    return None


def extract_effective_date(text_block: str) -> str | None:
    m = EFFECTIVE_DATE_RE.search(text_block)
    if not m:
        return None
    raw = m.group("date")
    # Normalize separators to '-'
    parts = DATE_NORMALIZE_RE.split(raw)
    if len(parts) == 3:
        y1, y2, y3 = parts
        # Heuristic: if first part length == 4 treat as YYYY
        if len(parts[0]) == 4:
            year, month, day = parts
        else:
            # assume D/M/Y or M/D/Y; if last length==2 -> 20xx assumption
            day, month, year = parts
            if len(year) == 2:
                year = ('20' if int(year) < 50 else '19') + year
        try:
            return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
        except Exception:
            return raw
    return raw


def extract_with_pdfminer(pdf_path: Path) -> str | None:
    if not PDFMINER_AVAILABLE:
        return None
    try:
        return extract_text(str(pdf_path))
    except Exception:
        return None


def process_pdf(pdf_path: Path, debug: bool = False, debug_lines: list[str] | None = None):
    print(f"[INFO] Processing {pdf_path.name}")
    reader = PdfReader(str(pdf_path))
    price_rows: list[PriceRow] = []
    # Collect all text to search for effective date fallback
    whole_text = []

    effective_date_global: str | None = None

    # First attempt per-page extraction via PyPDF2
    for page_index, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ''
        except Exception as e:
            print(f"[WARN] PyPDF2 failed page {page_index}: {e}")
            text = ''
        whole_text.append(text)
        if not effective_date_global:
            effective_date_global = extract_effective_date(text)

        for raw_line in text.splitlines():
            line = normalize_line(raw_line)
            # Quick filter to skip lines without an index hint
            if not any(iv in line for iv in INDEX_VALUES):
                continue
            overseas = '海外' in line or 'overseas' in line.lower()
            parsed = try_parse_line(line)
            if parsed:
                row = PriceRow(
                    series=parsed['series'],
                    subseries=parsed.get('subseries', ''),
                    index=parsed['index'],
                    coating=parsed['coating'],
                    price_hkd=parsed['price_hkd'],
                    overseas=overseas,
                    source_file=pdf_path.name,
                    page=page_index,
                    effective_date=effective_date_global,
                )
                price_rows.append(row)
                continue
            # Fallback pattern: index + multiple numeric tokens
            alt_match = re.match(rf'^({INDEX_RE})\s+((?:\d+\*+|\d+)(?:\s+(?:\d+\*+|\d+))+)$', line)
            if alt_match:
                idx = alt_match.group(1)
                rest = alt_match.group(2)
                tokens = rest.split()
                for pos, tok in enumerate(tokens, start=1):
                    m2 = re.match(r'(\d+)(\*+)?', tok)
                    if not m2:
                        continue
                    value = int(m2.group(1))
                    starred = bool(m2.group(2))
                    price_rows.append(
                        PriceRow(
                            series='UNKNOWN',
                            subseries='',
                            index=idx,
                            coating=f'variant{pos}',
                            price_hkd=value,
                            overseas=overseas,
                            source_file=pdf_path.name,
                            page=page_index,
                            effective_date=effective_date_global,
                            starred=starred,
                        )
                    )
                continue
            if debug and debug_lines is not None:
                debug_lines.append(f"UNMATCHED: p{page_index}: {line}")

    # If nothing parsed and pdfminer available, try whole-document fallback
    if not price_rows:
        alt = extract_with_pdfminer(pdf_path)
        if alt:
            if not effective_date_global:
                effective_date_global = extract_effective_date(alt)
            for i, raw_line in enumerate(alt.splitlines(), start=1):
                line = normalize_line(raw_line)
                if not any(iv in line for iv in INDEX_VALUES):
                    continue
                parsed = try_parse_line(line)
                if not parsed:
                    if debug and debug_lines is not None and any(iv in line for iv in INDEX_VALUES):
                        debug_lines.append(f"PDFMINER UNMATCHED: {line}")
                    continue
                overseas = '海外' in line or 'overseas' in line.lower()
                price_rows.append(
                    PriceRow(
                        series=parsed['series'], subseries=parsed.get('subseries', ''), index=parsed['index'],
                        coating=parsed['coating'], price_hkd=parsed['price_hkd'], overseas=overseas,
                        source_file=pdf_path.name, page=i, effective_date=effective_date_global,
                    )
                )
    return price_rows


def main():
    debug = '--debug' in sys.argv
    debug_lines: list[str] = [] if debug else None
    if not PDF_DIR.exists():
        print(f"[ERROR] PDF directory not found: {PDF_DIR}")
        sys.exit(1)

    all_rows: list[PriceRow] = []
    for pdf in sorted(PDF_DIR.glob('*.pdf')):
        all_rows.extend(process_pdf(pdf, debug=debug, debug_lines=debug_lines))

    # Deduplicate (series, subseries, index, coating, price) keep first
    seen = set()
    unique_rows = []
    for r in all_rows:
        key = (r.series, r.subseries, r.index, r.coating, r.price_hkd, r.overseas)
        if key in seen:
            continue
        seen.add(key)
        unique_rows.append(r)

    if not unique_rows:
        print("[WARN] No rows parsed. Generating sample placeholder data so UI still functions.")
        sample = [
            PriceRow(series='NULUX', subseries='BlueControl', index='1.6', coating='UV+', price_hkd=880, overseas=False, source_file='SAMPLE', page=1, effective_date=str(date.today())),
            PriceRow(series='NULUX', subseries='PhotoChromic', index='1.67', coating='AR', price_hkd=1320, overseas=True, source_file='SAMPLE', page=1, effective_date=str(date.today())),
        ]
        unique_rows = sample
    print(f"[INFO] Extracted {len(unique_rows)} unique rows (raw {len(all_rows)})")

    with OUT_PATH.open('w', encoding='utf-8') as f:
        json.dump([asdict(r) for r in unique_rows], f, ensure_ascii=False, indent=2)
    print(f"[OK] Wrote {OUT_PATH}")

    if debug and debug_lines:
        dbg_path = ROOT / 'scripts' / 'debug_extracted_lines.txt'
        dbg_path.write_text('\n'.join(debug_lines), encoding='utf-8')
        print(f"[DEBUG] Wrote unmatched candidate lines to {dbg_path}")

if __name__ == '__main__':
    main()

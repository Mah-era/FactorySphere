// Reports remain self-contained and usable offline without loading app fonts.
export const REPORT_THEME = `
:root{color-scheme:light}*{box-sizing:border-box}
body{font:14px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#2b2d41;background:#f5f2ee;max-width:1280px;margin:48px auto;padding:0 36px 60px}
body:before{content:"FACTORYSPHERE / DECISION INTELLIGENCE";display:block;color:#995043;font-size:10px;letter-spacing:2px;border-top:4px solid #2b2d41;padding-top:22px;margin-bottom:25px}
h1{font-size:34px;line-height:1.2;letter-spacing:-1.2px;margin:25px 0 18px;color:#2b2d41}h2{font-size:20px;line-height:1.35;letter-spacing:-.5px;margin:38px 0 18px;padding-bottom:12px;border-bottom:1px solid #d6ccc3}h3{font-size:16px}
p,small{color:#626577}table{border-collapse:collapse;width:100%;background:#fffdfa;font-size:12px}td,th{padding:12px 14px;text-align:left;border-bottom:1px solid #e5ddd5;vertical-align:top}th{background:#e9e1d8;color:#5d5260;font-size:11px;font-weight:600}tr:last-child td{border-bottom:0}
.panel{background:#fffdfa;border:1px solid #e0d7ce;border-radius:10px;padding:24px}.panel h2{margin-top:0;font-size:18px;border:0;padding:0}.panel p{font-size:12px;line-height:1.65}.visual-grid{margin:24px 0}.visual-plot{border-radius:7px;background:#faf7f3}.visual-source{font-size:10px}.table-wrap{overflow:auto}.visual-evidence{margin-top:18px;padding-top:12px;border-top:1px solid #e5ddd5}.visual-evidence summary{color:#995043;cursor:pointer;font-size:12px}.visual-evidence table{margin-top:14px}a{color:#995043}svg{max-width:100%}
@media(max-width:760px){body{padding:0 18px 35px;margin:25px auto}h1{font-size:27px}.visual-grid{grid-template-columns:1fr!important}table{font-size:10px}td,th{padding:8px}}
@media print{body{background:white;max-width:none;margin:0;padding:0;font-size:11px}h1{font-size:27px}h2{break-after:avoid}.panel{break-inside:avoid;margin-bottom:20px}.visual-grid{display:block}.visual-plot{max-height:none;overflow:visible}table{font-size:10px}thead{display:table-header-group}tr{break-inside:avoid}body:before{margin-bottom:18px}*{print-color-adjust:exact}}
`;

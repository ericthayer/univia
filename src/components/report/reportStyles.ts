import { primitiveTokens, surfaceTokens } from '../../theme/tokens';
import type { ReportTone } from './reportModel';

/**
 * Print stylesheet for exported reports. Always the light palette: paper is
 * white, and the tinted pills keep the instrument-panel look without heavy ink.
 */
const light = primitiveTokens.light;

export const REPORT_TONE_TEXT: Record<ReportTone, string> = {
  neutral: light.text.primary,
  success: light.toneText.success,
  warning: light.toneText.warning,
  error: light.toneText.error,
  info: light.toneText.info,
};

const TONE_FILL: Record<ReportTone, string> = {
  neutral: light.text.secondary,
  success: light.success.main,
  warning: light.warning.main,
  error: light.error.main,
  info: light.toneText.info,
};

const toneRules = (Object.keys(TONE_FILL) as ReportTone[])
  .map(
    (tone) => `
.pill[data-variant="tonal"][data-tone="${tone}"]{color:${REPORT_TONE_TEXT[tone]};background:color-mix(in srgb,${TONE_FILL[tone]} 14%,#fff);border-color:color-mix(in srgb,${TONE_FILL[tone]} 30%,#fff)}
[data-tone="${tone}"] .meter>span,.mark[data-tone="${tone}"]{background:${TONE_FILL[tone]}}
.value[data-tone="${tone}"]{color:${REPORT_TONE_TEXT[tone]}}`,
  )
  .join('');

export function buildReportStyles(fontUrl: string): string {
  const core = `${surfaceTokens.coreRadius}px`;
  return `
@font-face{font-family:'DM Sans';src:url('${fontUrl}') format('truetype');font-weight:100 1000;font-style:normal}
@page{size:letter;margin:16mm 15mm 18mm;
  @bottom-left{content:"Univia";font:600 8pt 'DM Sans',sans-serif;color:${light.text.secondary};letter-spacing:.14em;text-transform:uppercase}
  @bottom-right{content:"Page " counter(page) " of " counter(pages);font:8pt 'DM Sans',sans-serif;color:${light.text.secondary}}}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'DM Sans','Inter',-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:475;font-size:10pt;line-height:1.55;color:${light.text.primary};background:#fff}
a{color:inherit;text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}
code,.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:8.5pt}
code{background:${light.background.paper};padding:1px 4px;border-radius:4px}
h1,h2,h3,h4,p{margin:0}
.eyebrow{font-size:7.5pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${light.text.secondary}}
.muted{color:${light.text.secondary}}
.num{font-variant-numeric:tabular-nums}

.masthead{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:18px;border-bottom:1px solid ${light.divider};margin-bottom:20px}
.masthead img{height:22px;width:auto;display:block}
.masthead .stamp{text-align:right}
.title-block{margin-bottom:18px}
.title-block h1{font-size:22pt;font-weight:700;letter-spacing:-.02em;line-height:1.15;margin:4px 0 6px}
.subject{font-size:10.5pt;overflow-wrap:anywhere}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px 20px;margin:16px 0 0;padding:14px 16px;border:1px solid ${light.divider};border-radius:${core}}
.meta dt{margin-bottom:2px}
.meta dd{margin:0;font-weight:600}
.pills{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.title-block .pills{margin-top:12px}
.pills-label{margin-bottom:4px}
.pill-group{break-inside:avoid}
.pill[data-free]{text-transform:none;letter-spacing:0;font-size:8pt;font-weight:500;padding:3px 10px}
.pill{display:inline-flex;align-items:center;gap:5px;min-height:18px;padding:2px 9px;border:1px solid ${light.divider};border-radius:999px;font-size:7pt;font-weight:600;letter-spacing:.06em;text-transform:uppercase;line-height:1.3;color:${light.text.secondary}}
.pill[data-variant="solid"]{background:${light.text.primary};border-color:${light.text.primary};color:#fff}
.pill[data-variant="outline"]{background:#fff;color:${light.text.secondary};border-color:color-mix(in srgb,${light.text.secondary} 45%,#fff)}
.pill[data-dot]::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor}

section.card{border:1px solid ${light.divider};border-radius:${core};padding:16px 18px;margin:0 0 14px}
section.card.break{break-before:page}
.card>header{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}
.card>header h2{font-size:13pt;font-weight:700;letter-spacing:-.01em;break-after:avoid}
.block+.block{margin-top:12px}
.subheading{display:flex;align-items:baseline;gap:8px;padding-top:12px;margin-top:4px;border-top:1px solid ${light.divider};break-after:avoid}
.subheading h3{font-size:10.5pt;font-weight:700}
p.para{overflow-wrap:anywhere}

dl.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 18px;margin:0}
dl.facts>div{min-width:0;break-inside:avoid}
dl.facts>div.wide{grid-column:1/-1}
dl.facts dt{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:2px}
dl.facts dd{margin:0;font-weight:600;overflow-wrap:anywhere}

ul.list,ol.list{margin:0;padding-left:18px}
ul.list li,ol.list li{padding:2px 0;overflow-wrap:anywhere}
ol.list li::marker{font-variant-numeric:tabular-nums;font-weight:600}

table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
caption{text-align:left;margin-bottom:6px}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid ${light.divider};vertical-align:top}
thead th{font-size:7.5pt;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${light.text.secondary}}
tbody th{font-weight:600}
tr{break-inside:avoid}
td .value{font-weight:700;font-size:11pt}
.meter{display:block;height:3px;width:100%;max-width:90px;margin-top:4px;border-radius:2px;background:${light.divider};overflow:hidden}
.meter>span{display:block;height:100%}

.callout{display:flex;gap:10px;padding:12px 14px;border:1px solid ${light.divider};border-radius:${core};background:${light.background.paper};break-inside:avoid}
.callout .mark{flex:none;width:4px;border-radius:2px;border:0}
.callout p+p{margin-top:3px}

figure{margin:0;break-inside:avoid}
figure img{display:block;max-width:100%;max-height:300px;width:auto;height:auto;border:1px solid ${light.divider};border-radius:10px}
figcaption{margin-top:4px}

ul.issues{list-style:none;margin:0;padding:0}
ul.issues>li{padding:14px 0;border-top:1px solid ${light.divider}}
ul.issues>li:first-child{border-top:0;padding-top:4px}
.issue-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px;break-after:avoid}
.issue-head h3,.issue-head h4{font-size:10.5pt;font-weight:700;overflow-wrap:anywhere}
.issue .pills{margin-bottom:6px}
.issue .desc{color:${light.text.secondary};margin-bottom:6px;overflow-wrap:anywhere}
.selector{display:block;padding:6px 10px;border-radius:8px;background:${light.background.paper};overflow-wrap:anywhere;margin-bottom:8px}
.fix{margin-top:6px;padding:10px 12px;border-left:2px solid ${light.text.primary};background:color-mix(in srgb,${light.background.paper} 70%,#fff);border-radius:0 8px 8px 0}
.fix>.eyebrow{display:block;margin-bottom:4px;color:${light.text.primary}}
.fix .eyebrow{break-after:avoid}
.fix>*+*{margin-top:6px}
.fix pre{margin:0;padding:8px 10px;border-radius:8px;background:#fff;border:1px solid ${light.divider};white-space:pre-wrap;overflow-wrap:anywhere;break-inside:avoid}

.closing{margin-top:18px;padding-top:12px;border-top:1px solid ${light.divider}}
${toneRules}
`;
}

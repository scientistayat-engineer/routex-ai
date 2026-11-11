import { AGENTS } from "./config.js";
import { $ } from "./ui.js";

const kpi = (label, val) => `<div class="kpi"><span>${label}</span><b>${val}</b></div>`;

export function renderAnalytics(history) {
  const n = history.length;
  const avgMs = n ? Math.round(history.reduce((a, r) => a + (r.total_ms || 0), 0) / n) : 0;
  const avgConf = n ? Math.round(history.reduce((a, r) => a + (r.confidence || 0), 0) / n * 100) : 0;
  const counts = {}; history.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const rated = history.filter(r => r.feedback), up = rated.filter(r => r.feedback > 0).length;
  $("#kpis").innerHTML =
    kpi("Total queries", n) + kpi("Avg latency", n ? (avgMs / 1000).toFixed(1) + "s" : "—") +
    kpi("Avg confidence", n ? avgConf + "%" : "—") + kpi("Top agent", top ? AGENTS[top[0]]?.role || top[0] : "—") +
    kpi("Satisfaction", rated.length ? Math.round(up / rated.length * 100) + "%" : "—");

  if (!n) { $("#donut").textContent = "No data yet. Ask something in the console or load sample data."; $("#bars").textContent = "No data yet."; $("#trend").textContent = "No data yet."; return; }
  const R = 70, C = 2 * Math.PI * R; let off = 0;
  const arcs = Object.entries(counts).map(([k, v]) => {
    const len = (v / n) * C;
    const s = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${AGENTS[k]?.color || "#888"}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"/>`;
    off += len; return s;
  }).join("");
  const legend = Object.entries(counts).map(([k, v]) => `<div><i style="background:${AGENTS[k]?.color}"></i>${AGENTS[k]?.role || k} · ${v}</div>`).join("");
  $("#donut").innerHTML = `<svg width="180" height="180" viewBox="0 0 180 180">${arcs}<text x="90" y="96" text-anchor="middle" fill="#e8edff" font-size="26" font-family="JetBrains Mono">${n}</text></svg><div class="legend">${legend}</div>`;

  const last = history.slice(-24), max = Math.max(...last.map(r => r.total_ms || 1));
  $("#bars").innerHTML = `<div class="bars">${last.map(r =>
    `<div class="bar" style="height:${Math.max(6, (r.total_ms / max) * 100)}%;background:${AGENTS[r.category]?.color || "#7c9cff"}" data-tip="${r.total_ms} ms · ${r.category}"></div>`).join("")}</div>`;

  // Confidence trend (area + line + dots)
  const W = 600, Hh = 200, pts = last.map((r, i) => [last.length < 2 ? W / 2 : 14 + i / (last.length - 1) * (W - 28), Hh - 16 - Math.max(0, Math.min(1, ((r.confidence || 0) - 0.5) / 0.5)) * (Hh - 40), r]);
  const line = pts.map(p => p.slice(0, 2).join(",")).join(" ");
  $("#trend").innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${pts[0][0]},${Hh} ${line} ${pts[pts.length - 1][0]},${Hh}" fill="url(#tg)"/>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${AGENTS[p[2].category]?.color || "#fff"}"><title>${Math.round(p[2].confidence * 100)}% · ${p[2].category}</title></circle>`).join("")}</svg>`;
}

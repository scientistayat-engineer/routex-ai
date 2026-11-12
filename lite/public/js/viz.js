// Routing map (SVG) as a reusable factory: used by the console and the hero demo.
import { AGENTS, ROUTER } from "./config.js";
import { $ } from "./ui.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent && parent.appendChild(n); return n;
};
const keys = Object.keys(AGENTS);
const Q = [70, 230], R = [250, 230];
const ay = i => 44 + i * 74.4;
const curve = (x1, y1, x2, y2) => `M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;

export function createViz(svg, statusEl) {
  const nodes = {}, lines = {}; let packets = [];
  const node = (key, x, y, meta, label, r = 26) => {
    const g = el("g", { class: "v-node", style: `--col:${meta.color}`, transform: `translate(${x} ${y})` }, svg);
    el("circle", { r }, g);
    el("text", { class: "v-ico" }, g).textContent = meta.icon;
    el("text", { class: "v-label", y: r + 16 }, g).textContent = label;
    nodes[key] = g;
  };
  const packet = (d, col, dur) => {
    const c = el("circle", { r: 5, fill: col, style: `filter:drop-shadow(0 0 8px ${col})` }, svg);
    el("animateMotion", { dur, repeatCount: "indefinite", path: d }, c); packets.push(c);
  };
  const reset = () => {
    Object.values(nodes).forEach(n => n.classList.remove("active", "dim"));
    Object.values(lines).forEach(l => l.classList.remove("on", "pulse"));
    packets.forEach(p => p.remove()); packets = [];
  };
  const setStatus = t => { if (statusEl) statusEl.textContent = t; };
  return {
    setStatus, reset,
    init() {
      svg.innerHTML = "";
      lines.q = el("path", { class: "v-line", d: curve(...Q, ...R), style: `--col:${ROUTER.color}` }, svg);
      keys.forEach((k, i) => { lines[k] = el("path", { class: "v-line", d: curve(...R, 540, ay(i)), style: `--col:${AGENTS[k].color}` }, svg); });
      node("query", ...Q, { icon: "?", color: "#c9d4ff" }, "QUERY", 22);
      node("router", ...R, ROUTER, "ROUTER", 32);
      keys.forEach((k, i) => node(k, 540, ay(i), AGENTS[k], AGENTS[k].role.toUpperCase()));
      reset();
    },
    classifying() {
      reset(); setStatus("classifying…");
      nodes.query.classList.add("active"); nodes.router.classList.add("active"); lines.q.classList.add("pulse");
      packet(lines.q.getAttribute("d"), ROUTER.color, "0.8s");
    },
    routed(cat) {
      const cats = [].concat(cat); reset(); setStatus(`routed → ${cats.map(c => c.toLowerCase()).join(" → ")}`);
      nodes.router.classList.add("active"); lines.q.classList.add("pulse");
      keys.forEach(k => { if (!cats.includes(k)) nodes[k].classList.add("dim"); });
      cats.forEach(c => { nodes[c].classList.add("active"); lines[c].classList.add("on"); packet(lines[c].getAttribute("d"), AGENTS[c].color, "0.9s"); });
    },
    idle() { reset(); setStatus("idle"); }
  };
}

let M;
export const initViz = () => { M = createViz($("#vizSvg"), $("#vizStatus")); M.init(); };
export const setStatus = t => M.setStatus(t);
export const classifying = () => M.classifying();
export const routed = c => M.routed(c);
export const idle = () => M.idle();

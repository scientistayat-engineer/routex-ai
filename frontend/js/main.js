import { api } from "./api.js";
import { EXAMPLES, AGENTS, AGENT_INFO, DEMO_LOOP } from "./config.js";
import { initAuth, onAuthChange } from "./auth.js";
import { loadHistory, saveRecord, clearHistory } from "./store.js";
import { renderAnalytics } from "./analytics.js";
import { initBackground } from "./background.js";
import { initLab } from "./lab.js";
import * as chat from "./chat.js";
import * as viz from "./viz.js";
import { $, $$, esc, fmtTime, toast } from "./ui.js";

let history = [];
const input = $("#queryInput");

async function refreshHistory() {
  try { history = await loadHistory(); } catch (e) { history = []; toast("Could not load history"); }
  renderAnalytics(history); renderHistoryList();
}

function renderHistoryList() {
  const q = $("#historySearch").value.toLowerCase();
  const items = history.filter(r => r.query.toLowerCase().includes(q)).slice().reverse();
  $("#historyList").innerHTML = items.length ? items.map(r =>
    `<div class="h-item" data-id="${r.id}"><div>${esc(r.query.slice(0, 90))}</div><small>${r.category} · ${fmtTime(r.ts)}</small></div>`).join("")
    : `<p class="muted">No history yet.</p>`;
  $$(".h-item").forEach(n => n.onclick = () => {
    const rec = history.find(r => r.id === n.dataset.id);
    if (rec) { chat.clearChat(); chat.loadConversation(rec); $("#drawer").classList.remove("open"); location.hash = "#console"; }
  });
}

async function submit() {
  const q = input.value.trim(); if (!q) return;
  input.value = ""; autosize(); $("#liveHint").textContent = "";
  const chainVal = $("#chainSelect").value, memory = $("#memToggle").checked ? chat.getMemory() : null;
  await chat.send(q, $("#modeSelect").value, async rec => {
    history.push(rec); renderAnalytics(history); renderHistoryList();
    try { await saveRecord(rec); } catch { toast("Saved locally only"); }
  }, { chain: chainVal ? chainVal.split(",") : null, memory });
}

function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; }

let hintTimer;
input.addEventListener("input", () => {
  autosize(); clearTimeout(hintTimer);
  hintTimer = setTimeout(async () => {
    const v = input.value.trim(); if (v.length < 4) return ($("#liveHint").textContent = "");
    try { const r = await api.classify(v); $("#liveHint").textContent = `⇄ likely → ${r.category.toLowerCase()}`; } catch { /* ignore */ }
  }, 350);
});

function setupVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("#micBtn"); if (!SR) { btn.style.display = "none"; return; }
  const rec = new SR(); rec.lang = "en-US"; rec.interimResults = false;
  rec.onresult = e => { input.value = e.results[0][0].transcript; autosize(); input.focus(); };
  rec.onend = () => btn.classList.remove("rec"); rec.onerror = () => btn.classList.remove("rec");
  btn.onclick = () => { btn.classList.add("rec"); rec.start(); };
}

async function checkHealth() {
  const pill = $("#healthPill");
  try {
    const h = await api.health();
    const lite = h.engine === "lite";
    pill.textContent = h.groq_key_set ? (lite ? "● online · lite" : "● online") : "● key missing"; pill.className = "pill " + (h.groq_key_set ? "ok" : "bad");
    pill.title = `Engine: ${lite ? "ROUTEX Lite (direct Groq API, no CrewAI)" : "CrewAI"} · Model: ${h.model} · LangSmith: ${h.langsmith ? "on" : "off"}`;
    if (lite) $("#footerText").textContent = "ROUTEX Lite: same agents and prompts, direct Groq API. The full CrewAI version runs locally. · Groq · FastAPI · Firebase · LangSmith";
  } catch { pill.textContent = "● offline"; pill.className = "pill bad"; }
}

const SAMPLE = { WRITE: ["Write a follow-up email", "Draft a short LinkedIn post"], MATH: ["What is 15 × 240?", "Solve 3x + 7 = 28"], EXPLAIN: ["Explain recursion", "How does GPS work?"], CODE: ["Write a binary search in Python", "Fix my JavaScript loop"], TRANSLATE: ["Translate good morning to Urdu", "Translate thank you to French"], SUMMARIZE: ["Summarize this news article", "Give me key points of this report"] };
async function seed() {
  const cats = Object.keys(AGENTS), now = Date.now();
  for (let i = 0; i < 24; i++) {
    const c = cats[Math.floor(Math.random() * cats.length)], total = 900 + Math.floor(Math.random() * 2600);
    const rec = { id: "s" + now + i, query: SAMPLE[c][i % 2], category: c, confidence: +(0.78 + Math.random() * 0.21).toFixed(2), reasoning: "Sample record.", agent: { key: c, role: AGENTS[c].role }, answer: "Sample answer generated for the dashboard demo.",
      steps: [{ step: "Classify query", agent: "Query Router", status: "ok", ms: Math.floor(total * .35) }, { step: "Generate answer", agent: AGENTS[c].role, status: "ok", ms: Math.ceil(total * .65) }],
      total_ms: total, ts: now - (24 - i) * 3600e3, feedback: Math.random() < .8 ? 1 : -1 };
    history.push(rec); try { await saveRecord(rec); } catch { /* local only */ }
  }
  renderAnalytics(history); renderHistoryList(); toast("Sample data loaded");
}

function setTheme(t) {
  document.documentElement.dataset.theme = t; try { localStorage.setItem("routex.theme", t); } catch { /* ignore */ }
  $$("#themes button").forEach(b => b.classList.toggle("on", b.dataset.t === t)); dispatchEvent(new Event("themechange"));
}

function openPalette() {
  const go = id => () => { location.hash = "#" + id; };
  const acts = [["Go to Console", go("console")], ["Go to Agents", go("agents")], ["Go to Analytics", go("analytics")], ["Go to Architecture", go("architecture")],
    ...EXAMPLES.map(e => ["Try: " + e.slice(0, 42), () => { input.value = e; autosize(); location.hash = "#console"; submit(); }]),
    ["Clear chat", () => chat.clearChat()], ["Open history", () => $("#drawer").classList.add("open")], ["Load sample data", seed],
    ...["cyber", "purple", "matrix", "sunset"].map(t => ["Theme: " + t, () => setTheme(t)])];
  const P = $("#palette"), I = $("#palInput"), L = $("#palList"); let sel = 0, list = acts;
  const draw = () => { L.innerHTML = list.map((a, i) => `<div class="pal-item ${i === sel ? "sel" : ""}" data-i="${i}">${esc(a[0])}<small>↵</small></div>`).join("") || `<div class="pal-item">No match</div>`; $$(".pal-item", L).forEach(n => n.onclick = () => run(+n.dataset.i)); };
  const close = () => P.classList.remove("open");
  const run = i => { const a = list[i]; if (a) { close(); a[1](); } };
  I.value = ""; list = acts; sel = 0; draw(); P.classList.add("open"); I.focus();
  I.oninput = () => { list = acts.filter(a => a[0].toLowerCase().includes(I.value.toLowerCase())); sel = 0; draw(); };
  I.onkeydown = e => { if (e.key === "Escape") close(); else if (e.key === "Enter") run(sel); else if (e.key === "ArrowDown") { sel = Math.min(list.length - 1, sel + 1); draw(); e.preventDefault(); } else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } };
  P.onclick = e => { if (e.target === P) close(); };
}

function download(name, text, type) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type })), download: name }); a.click(); URL.revokeObjectURL(a.href);
}
function exportHistory(fmt) {
  if (!history.length) return toast("No history to export");
  if (fmt === "json") return download("routex-history.json", JSON.stringify(history, null, 2), "application/json");
  const cols = ["ts", "query", "category", "confidence", "total_ms", "feedback"], q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  download("routex-history.csv", [cols.join(","), ...history.map(r => cols.map(c => q(c === "ts" ? new Date(r.ts).toISOString() : r[c])).join(","))].join("\n"), "text/csv");
}

function enhance() {
  initLab();
  $("#expCsv").onclick = () => exportHistory("csv"); $("#expJson").onclick = () => exportHistory("json");
  $("#keysClose").onclick = () => $("#keys").classList.remove("open");
  addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "?" && !typing) $("#keys").classList.toggle("open"); if (e.key === "Escape") $$(".modal.open").forEach(m => m.classList.remove("open"));
  });
  if ("IntersectionObserver" in window) {
    const links = $$(".topbar nav a"), spy = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) links.forEach(l => l.classList.toggle("on", l.getAttribute("href") === "#" + x.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(s => spy.observe(s));
  }
  $("#seedBtn").onclick = seed; $("#palBtn").onclick = openPalette;
  $$("#themes button").forEach(b => b.onclick = () => setTheme(b.dataset.t));
  let saved = "cyber"; try { saved = localStorage.getItem("routex.theme") || "cyber"; } catch { /* ignore */ } setTheme(saved);
  chat.setFeedbackHandler(async rec => { const i = history.findIndex(r => r.id === rec.id); if (i >= 0) history[i] = rec; renderAnalytics(history); try { await saveRecord(rec); } catch { /* ignore */ } });
  addEventListener("scroll", () => { const d = document.documentElement; $("#progress").style.width = (scrollY / Math.max(1, d.scrollHeight - innerHeight)) * 100 + "%"; }, { passive: true });
  const hvz = $(".hero-viz");
  hvz.addEventListener("pointermove", e => { const r = hvz.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; hvz.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; });
  hvz.addEventListener("pointerleave", () => { hvz.style.transform = ""; });
  // agent cards
  $("#agentCards").innerHTML = Object.values(AGENTS).map(a => `
    <button class="agent-card" data-k="${a.key}" style="--col:${a.color}">
      <div class="ico">${a.icon}</div><h4>${a.role}</h4><p>${AGENT_INFO[a.key].goal}</p><em>Try: “${esc(AGENT_INFO[a.key].ex.slice(0, 34))}…”</em></button>`).join("");
  $$(".agent-card").forEach(c => c.onclick = () => { input.value = AGENT_INFO[c.dataset.k].ex; autosize(); location.hash = "#console"; input.focus(); });
  // spotlight follows the pointer
  addEventListener("pointermove", e => {
    const t = e.target.closest && e.target.closest(".panel,.agent-card,.kpi,.arch-card"); if (!t) return;
    const r = t.getBoundingClientRect(); t.style.setProperty("--mx", e.clientX - r.left + "px"); t.style.setProperty("--my", e.clientY - r.top + "px");
  });
  // scroll reveal
  const rv = $$(".reveal");
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 }); rv.forEach(n => io.observe(n)); }
  else rv.forEach(n => n.classList.add("in"));
  // count-up stats
  $$("[data-to]").forEach(b => { const to = +b.dataset.to, suf = b.dataset.suf || ""; let n = 0; const t = setInterval(() => { n = Math.min(to, n + Math.ceil(to / 30)); b.textContent = n + suf; if (n >= to) clearInterval(t); }, 40); });
  // hero demo loop
  const hv = viz.createViz($("#heroSvg"), null); hv.init(); let i = 0;
  const step = () => {
    const [q, cat] = DEMO_LOOP[i++ % DEMO_LOOP.length], cap = $("#heroCaption");
    cap.textContent = `“${q}”  ⇄  classifying…`; hv.classifying();
    setTimeout(() => { hv.routed(cat); cap.textContent = `“${q}”  →  ${AGENTS[cat].role}`; }, 1100);
  };
  step(); setInterval(step, 3300);
}

function init() {
  initBackground(); viz.initViz(); setupVoice(); enhance();
  $("#chips").innerHTML = EXAMPLES.map(e => `<button class="chip">${esc(e.length > 48 ? e.slice(0, 46) + "…" : e)}</button>`).join("");
  $$(".chip").forEach((c, i) => c.onclick = () => { input.value = EXAMPLES[i]; autosize(); submit(); });
  $("#sendBtn").onclick = submit;
  input.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) { e.preventDefault(); submit(); } });
  addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); } });
  $("#clearBtn").onclick = () => chat.clearChat();
  $("#exportBtn").onclick = chat.exportMarkdown;
  $("#historyBtn").onclick = () => $("#drawer").classList.add("open");
  $("#drawerClose").onclick = () => $("#drawer").classList.remove("open");
  $("#historySearch").oninput = renderHistoryList;
  $("#historyClear").onclick = async () => { if (confirm("Delete all saved history?")) { await clearHistory(); await refreshHistory(); toast("History deleted"); } };
  onAuthChange(refreshHistory);
  initAuth().catch(e => toast("Firebase init failed: " + e.message));
  refreshHistory(); checkHealth();
}
init();

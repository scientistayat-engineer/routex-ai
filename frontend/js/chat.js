import { api } from "./api.js";
import { AGENTS } from "./config.js";
import * as viz from "./viz.js";
import { $, esc, markdown, toast } from "./ui.js";

let messages = [], fbHandler = null;
export function setFeedbackHandler(fn) { fbHandler = fn; } // {role, text, rec?}

function scroll() { const m = $("#messages"); m.scrollTop = m.scrollHeight; }
function hideEmpty() { const e = $("#emptyState"); if (e) e.style.display = "none"; }

function addUser(text) {
  hideEmpty();
  const d = document.createElement("div"); d.className = "msg user"; d.textContent = text;
  $("#messages").appendChild(d); scroll();
}

function addTyping() {
  const d = document.createElement("div"); d.className = "msg bot";
  d.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
  $("#messages").appendChild(d); scroll(); return d;
}

export function renderBot(rec, node, animate) {
  const a = AGENTS[rec.category] || { role: rec.category, color: "#7c9cff", icon: "•" };
  const d = node || document.createElement("div");
  d.className = "msg bot"; d.style.setProperty("--col", a.color);
  d.innerHTML = `
    <div class="meta">
      <span class="badge" style="color:${a.color}">${a.icon} ${esc(a.role)}</span>
      <span class="muted">${Math.round(rec.confidence * 100)}% · ${(rec.total_ms / 1000).toFixed(1)}s${rec.used_fallback ? " · fallback" : ""}${rec.forced ? " · manual" : ""}</span>
    </div>
    <div class="body"></div>
    <div class="msg-actions"><button data-copy>Copy</button><button data-tts title="Read aloud">🔊</button><button class="fb" data-fb="1">👍</button><button class="fb" data-fb="-1">👎</button></div>`;
  d.querySelector("[data-copy]").onclick = () => { navigator.clipboard.writeText(rec.answer); toast("Copied"); };
  d.querySelector("[data-tts]").onclick = () => {
    if (!("speechSynthesis" in window)) return toast("Speech not supported in this browser");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(rec.answer.replace(/[*`#]/g, "")); u.lang = /[\u0600-\u06FF]/.test(rec.answer) ? "ur-PK" : "en-US"; speechSynthesis.speak(u);
  };
  d.querySelectorAll("[data-fb]").forEach(b => {
    if (rec.feedback === +b.dataset.fb) b.classList.add("on");
    b.onclick = () => { rec.feedback = +b.dataset.fb; d.querySelectorAll("[data-fb]").forEach(x => x.classList.toggle("on", x === b)); toast("Thanks for the feedback"); fbHandler && fbHandler(rec); };
  });
  if (!node) $("#messages").appendChild(d);
  const body = d.querySelector(".body"), full = rec.answer;
  if (!animate) { body.innerHTML = markdown(full); scroll(); return; }
  let i = 0;
  const tick = () => {
    i = Math.min(full.length, i + 4);
    let part = full.slice(0, i); if ((part.match(/```/g) || []).length % 2) part += "\n```";
    body.innerHTML = markdown(part); scroll();
    if (i < full.length) setTimeout(tick, 14);
  };
  tick();
}

export function showDecision(rec) {
  const a = AGENTS[rec.category];
  $("#decCat").textContent = `${a?.icon || ""} ${rec.category}`; $("#decCat").style.color = a?.color;
  $("#decMeter").style.width = Math.round(rec.confidence * 100) + "%";
  $("#decConf").textContent = Math.round(rec.confidence * 100) + "%";
  $("#decReason").textContent = rec.reasoning || "—";
  $("#trace").innerHTML = rec.steps.map(s => `
    <div class="trace-row"><span class="dot ${s.status}"></span>
      <div>${esc(s.step)}<small>${esc(s.agent)} · ${s.status}</small></div><span class="ms">${s.ms} ms</span></div>`).join("");
  viz.routed(rec.chain && rec.chain.length ? rec.chain : rec.category);
}

export function loadConversation(rec) {
  hideEmpty(); addUser(rec.query); renderBot(rec); showDecision(rec);
  messages.push({ role: "user", text: rec.query }, { role: "bot", text: rec.answer, rec });
}

export function clearChat() {
  messages = [];
  document.querySelectorAll("#messages .msg").forEach(n => n.remove());
  const e = $("#emptyState"); if (e) e.style.display = "";
  viz.idle(); $("#trace").innerHTML = ""; $("#decCat").textContent = "—"; $("#decMeter").style.width = "0"; $("#decConf").textContent = "—";
}

export function exportMarkdown() {
  if (!messages.length) return toast("Nothing to export yet");
  const md = "# ROUTEX conversation\n\n" + messages.map(m => m.role === "user" ? `**You:** ${m.text}\n` : `**${m.rec?.agent?.role || "Agent"}** (${m.rec?.category}):\n\n${m.text}\n`).join("\n---\n\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([md], { type: "text/markdown" })), download: "routex-conversation.md" });
  a.click(); URL.revokeObjectURL(a.href);
}

export function getMemory() {
  const out = [];
  for (let i = 0; i < messages.length - 1; i++) if (messages[i].role === "user" && messages[i + 1].role === "bot") out.push({ q: messages[i].text, a: messages[i + 1].text });
  return out.slice(-4);
}

export async function send(query, forceAgent, onDone, opts = {}) {
  addUser(query); messages.push({ role: "user", text: query });
  const typing = addTyping(); viz.classifying();
  $("#sendBtn").disabled = true;
  try {
    const rec = await api.route(query, forceAgent, opts.chain, opts.memory);
    rec.ts = Date.now();
    renderBot(rec, typing, true); showDecision(rec);
    messages.push({ role: "bot", text: rec.answer, rec });
    onDone && onDone(rec);
  } catch (e) {
    typing.className = "msg bot"; typing.innerHTML = `<b style="color:var(--danger)">Error:</b> ${esc(e.message)}`;
    viz.idle(); toast("Request failed");
  } finally { $("#sendBtn").disabled = false; }
}

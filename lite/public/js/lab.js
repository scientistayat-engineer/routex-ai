// Evaluation Lab: batch-classify queries and compare against expected labels.
import { api } from "./api.js";
import { AGENTS } from "./config.js";
import { $, esc, toast } from "./ui.js";

const SAMPLE = `What is 144 divided by 12? | MATH
Solve 2x + 5 = 17 | MATH
Why do cats purr? | EXPLAIN
Explain blockchain in simple words | EXPLAIN
Write a Python function for factorial | CODE
Translate 'good night' into Spanish | TRANSLATE
Summarize the key points of this article | SUMMARIZE
Give me a TL;DR of this report | SUMMARIZE
Write a polite email to my professor | WRITE
Draft a short LinkedIn post about my project | WRITE`;
const keys = Object.keys(AGENTS);

function parse(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 10).map(l => {
    const [q, e] = l.split("|").map(s => s.trim()); const exp = (e || "").toUpperCase();
    return { q, exp: keys.includes(exp) ? exp : null };
  });
}

function render(items, results) {
  const rows = items.map((it, i) => {
    const r = results[i] || {}, ok = it.exp ? r.category === it.exp : null, a = AGENTS[r.category] || {};
    return `<tr><td>${esc(it.q)}</td><td>${it.exp || "—"}</td><td><span class="badge" style="color:${a.color}">${r.category}</span></td>
      <td>${Math.round((r.confidence || 0) * 100)}%</td><td>${ok === null ? "—" : ok ? "✅" : "❌"}</td><td class="mono">${r.ms} ms${r.used_fallback ? " · fb" : ""}</td></tr>`;
  }).join("");
  const graded = items.filter(i => i.exp), hits = graded.filter((it, k) => results[items.indexOf(it)].category === it.exp).length;
  const acc = graded.length ? Math.round(hits / graded.length * 100) + "%" : "—";
  const conf = Math.round(results.reduce((a, r) => a + r.confidence, 0) / results.length * 100);
  const fb = results.filter(r => r.used_fallback).length;
  // confusion matrix
  const M = {}; keys.forEach(k => { M[k] = {}; keys.forEach(c => (M[k][c] = 0)); });
  items.forEach((it, i) => { if (it.exp && results[i]) M[it.exp][results[i].category]++; });
  const mx = Math.max(1, ...keys.flatMap(k => keys.map(c => M[k][c])));
  const matrix = `<table class="matrix"><tr><th>actual ↓ / predicted →</th>${keys.map(c => `<th>${c.slice(0, 4)}</th>`).join("")}</tr>` +
    keys.map(k => `<tr><th>${k.slice(0, 4)}</th>${keys.map(c => `<td style="background:rgba(var(--accent-rgb),${M[k][c] / mx * .7})">${M[k][c] || ""}</td>`).join("")}</tr>`).join("") + "</table>";
  $("#labOut").innerHTML = `<div class="lab-kpis"><div class="kpi"><span>Accuracy</span><b>${acc}</b></div><div class="kpi"><span>Avg confidence</span><b>${conf}%</b></div><div class="kpi"><span>Fallbacks</span><b>${fb}</b></div><div class="kpi"><span>Queries</span><b>${items.length}</b></div></div>
    <div class="table-wrap"><table class="lab-table"><tr><th>Query</th><th>Expected</th><th>Predicted</th><th>Conf.</th><th></th><th>Time</th></tr>${rows}</table></div>
    <h3 style="margin:22px 0 10px">Confusion matrix</h3><div class="table-wrap">${matrix}</div>`;
}

export function initLab() {
  $("#labSample").onclick = () => { $("#labInput").value = SAMPLE; };
  $("#labRun").onclick = async () => {
    const items = parse($("#labInput").value); if (!items.length) return toast("Add at least one query");
    const btn = $("#labRun"); btn.disabled = true; $("#labStatus").textContent = `Classifying ${items.length} queries…`;
    try { const { results } = await api.batch(items.map(i => i.q)); render(items, results); $("#labStatus").textContent = "Done"; }
    catch (e) { $("#labStatus").textContent = ""; toast(e.message); }
    finally { btn.disabled = false; }
  };
}

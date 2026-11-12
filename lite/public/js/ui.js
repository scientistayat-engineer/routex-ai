// Small UI helpers: toasts, safe markdown, DOM shortcuts.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function toast(msg, ms = 2400) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Models sometimes answer maths in LaTeX. Turn the common commands into readable plain text.
export function plainMath(s) {
  return String(s)
    .replace(/\\\\(\[[^\]]*\])?/g, "\n")
    .replace(/\\boxed\{([^{}]*)\}/g, "**$1**")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\begin\{[a-z*]+\}|\\end\{[a-z*]+\}/g, "")
    .replace(/\\\[|\\\]|\\\(|\\\)/g, "")
    .replace(/\\times/g, "×").replace(/\\cdot/g, "·").replace(/\\div/g, "÷").replace(/\\approx/g, "≈")
    .replace(/\\neq/g, "≠").replace(/\\leq?/g, "≤").replace(/\\geq?/g, "≥").replace(/\\pi/g, "π")
    .replace(/\\[,;! ]/g, " ").replace(/&=/g, "=")
    .replace(/\n{3,}/g, "\n\n");
}

// Minimal, XSS-safe markdown: code blocks, inline code, bold, lists, paragraphs.
export function markdown(src) {
  const blocks = [];
  let text = esc(plainMath(src)).replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, _l, code) => {
    blocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `@@B${blocks.length - 1}@@`;
  });
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
  const out = []; let list = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map(l => `<li>${l}</li>`).join("")}</ul>`); list = []; } };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (m) list.push(m[1]);
    else { flush(); if (line.trim()) out.push(/^@@B\d+@@$/.test(line.trim()) ? line.trim() : `<p dir="auto">${line}</p>`); }
  }
  flush();
  return out.join("").replace(/@@B(\d+)@@/g, (_, i) => blocks[+i]);
}

export const fmtTime = ts => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

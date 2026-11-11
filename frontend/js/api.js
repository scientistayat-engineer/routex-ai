import { CONFIG } from "./config.js";

async function request(path, options = {}) {
  const res = await fetch(CONFIG.API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) throw new Error((data && (data.detail || data.message)) || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request("/api/health"),
  route: (query, force_agent, chain, memory) => request("/api/route", { method: "POST", body: JSON.stringify({ query, force_agent: force_agent || null, chain: chain || null, memory: memory || null }) }),
  batch: (queries) => request("/api/batch", { method: "POST", body: JSON.stringify({ queries }) }),
  classify: (query) => request("/api/classify", { method: "POST", body: JSON.stringify({ query }) })
};

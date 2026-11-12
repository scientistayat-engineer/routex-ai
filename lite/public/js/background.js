// Ambient "signal network" background: drifting nodes with faint links.
export function initBackground() {
  const c = document.getElementById("bg"), x = c.getContext("2d");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let w, h, pts = [], rgb = "124,156,255";
  addEventListener("themechange", () => { rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim(); });
  const resize = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    pts = Array.from({ length: Math.min(70, Math.floor(w / 22)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 }));
  };
  addEventListener("resize", resize); resize();
  (function frame() {
    x.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h;
      x.fillStyle = `rgba(${rgb},.55)`; x.beginPath(); x.arc(p.x, p.y, 1.4, 0, 7); x.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 130) { x.strokeStyle = `rgba(${rgb},${.14 * (1 - d / 130)})`; x.beginPath(); x.moveTo(pts[i].x, pts[i].y); x.lineTo(pts[j].x, pts[j].y); x.stroke(); }
    }
    requestAnimationFrame(frame);
  })();
}

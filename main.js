(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // scroll reveal
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // count-up on stats
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || "";
    if (reduce) return;
    const o = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      const step = (t) => { const p = Math.min((t - t0) / 1100, 1), v = end * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    o.observe(el);
  });

  // hero: a link graph where news ripples outward from a node
  const cv = document.getElementById("field");
  if (!cv || reduce) return;
  const ctx = cv.getContext("2d");
  let W, H, dpr, nodes = [], ripples = [];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (W * H) / 16000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.9,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, lit: 0,
    }));
  }
  function ripple(x, y) { ripples.push({ x, y, r: 0 }); }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const ink = css("--ink"), accent = css("--accent");
    ctx.lineWidth = 1;
    for (const a of nodes) {
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;
      a.lit *= 0.965;
    }
    for (const rp of ripples) {
      rp.r += 3.2;
      for (const a of nodes) if (Math.abs(Math.hypot(a.x - rp.x, a.y - rp.y) - rp.r) < 14) a.lit = 1;
    }
    ripples = ripples.filter((r) => r.r < Math.max(W, H));
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 150) continue;
        const lit = Math.max(a.lit, b.lit);
        ctx.globalAlpha = (1 - d / 150) * (0.16 + lit * 0.7);
        ctx.strokeStyle = lit > 0.2 ? accent : ink;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const a of nodes) {
      ctx.globalAlpha = 0.35 + a.lit * 0.65;
      ctx.fillStyle = a.lit > 0.2 ? accent : ink;
      ctx.beginPath(); ctx.arc(a.x, a.y, 2 + a.lit * 3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  addEventListener("resize", resize);
  cv.parentElement.addEventListener("pointerdown", (e) => ripple(e.clientX, e.clientY));
  resize();
  setTimeout(() => ripple(W * 0.7, H * 0.35), 900);
  setInterval(() => { if (!document.hidden && nodes.length) { const n = nodes[(Math.random() * nodes.length) | 0]; ripple(n.x, n.y); } }, 4200);
  frame();
})();

// ============================================
// SZCUTZ — Ambient particle layer
// A fixed canvas that draws small drifting dots +
// a few large soft-glow orbs, using requestAnimationFrame.
// mix-blend-mode: difference (set in CSS) is what makes
// the same gray tones auto-adapt to dark/light backgrounds.
// ============================================

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Small twinkling dots — drift slowly, wrap around edges
  const DOT_COUNT = 60;
  const dots = Array.from({ length: DOT_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.6,
    speedX: (Math.random() - 0.5) * 0.15,
    speedY: (Math.random() - 0.5) * 0.15,
    opacity: Math.random() * 0.5 + 0.2,
  }));

  // Large soft-glow orbs — drift and bounce off edges
  const ORB_COUNT = 2;
  const orbs = Array.from({ length: ORB_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 150 + Math.random() * 150,
    dx: (Math.random() - 0.5) * 0.12,
    dy: (Math.random() - 0.5) * 0.12,
  }));


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  orbs.forEach((o) => {
    const gradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    gradient.addColorStop(0, 'rgba(130,130,130,0.16)');
    gradient.addColorStop(1, 'rgba(130,130,130,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();

    o.x += o.dx;
    o.y += o.dy;
    if (o.x < -o.r || o.x > canvas.width + o.r) o.dx *= -1;
    if (o.y < -o.r || o.y > canvas.height + o.r) o.dy *= -1;
  });

  dots.forEach((d) => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(140,140,140,${d.opacity})`;
    ctx.fill();

    d.x += d.speedX;
    d.y += d.speedY;
    if (d.x < 0) d.x = canvas.width;
    if (d.x > canvas.width) d.x = 0;
    if (d.y < 0) d.y = canvas.height;
    if (d.y > canvas.height) d.y = 0;
  });

  requestAnimationFrame(draw);
}

  draw();
})();
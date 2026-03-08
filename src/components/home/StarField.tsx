import { useEffect, useRef } from "react";

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; baseY: number; r: number; alpha: number; speed: number; drift: number; depth: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    const isMobile = window.innerWidth < 768;

    const init = () => {
      resize();
      stars.length = 0;
      const density = isMobile ? 6000 : 3000;
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / density);
      for (let i = 0; i < count; i++) {
        const y = Math.random() * canvas.offsetHeight;
        stars.push({
          x: Math.random() * canvas.offsetWidth,
          y,
          baseY: y,
          r: Math.random() * (isMobile ? 1.2 : 1.5) + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.3 + 0.1,
          drift: (Math.random() - 0.5) * 0.15,
          depth: Math.random() * 0.8 + 0.2,
        });
      }
    };

    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const scroll = scrollY.current;

      for (const s of stars) {
        s.alpha += Math.sin(Date.now() * 0.001 * s.speed) * 0.008;
        s.alpha = Math.max(0.1, Math.min(1, s.alpha));
        s.y -= s.speed * 0.3;
        s.x += s.drift * 0.3;
        if (s.y < -2) { s.y = h + 2; s.baseY = h + 2; s.x = Math.random() * w; }
        if (s.x < -2) s.x = w + 2;
        if (s.x > w + 2) s.x = -2;

        const parallaxOffset = scroll * s.depth * 0.15;
        const drawY = s.y - parallaxOffset;

        if (drawY < -4 || drawY > h + 4) continue;

        ctx.beginPath();
        ctx.arc(s.x, drawY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(195, 80%, 80%, ${s.alpha * 0.7})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", init);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default StarField;

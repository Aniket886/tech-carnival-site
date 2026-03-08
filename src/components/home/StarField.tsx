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

    interface Star {
      x: number;
      y: number;
      r: number;
      alpha: number;
      targetAlpha: number;
      speed: number;
      driftX: number;
      driftY: number;
      depth: number;
      phase: number;
      twinkleSpeed: number;
      hue: number;
      glowSize: number;
    }

    const stars: Star[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    const isMobile = window.innerWidth < 768;

    const init = () => {
      resize();
      stars.length = 0;
      const density = isMobile ? 5000 : 2500;
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / density);
      for (let i = 0; i < count; i++) {
        const isGlowing = Math.random() < 0.25; // 25% of stars get bloom
        stars.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          r: Math.random() * (isMobile ? 1.2 : 1.8) + 0.3,
          alpha: Math.random() * 0.3,
          targetAlpha: Math.random() * 0.6 + 0.4,
          speed: Math.random() * 0.4 + 0.05,
          driftX: (Math.random() - 0.5) * 0.2,
          driftY: (Math.random() - 0.5) * 0.15 - 0.05, // slight upward bias
          depth: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.002 + 0.0008,
          hue: Math.random() < 0.6 ? 210 : 195, // mix of white-blue and cyan
          glowSize: isGlowing ? Math.random() * 6 + 4 : 0,
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
      const now = Date.now();

      for (const s of stars) {
        // Twinkle: smooth sine-based fade in/out at different intervals
        const twinkle = Math.sin(now * s.twinkleSpeed + s.phase);
        // Map sine [-1,1] to [0.05, targetAlpha]
        s.alpha = 0.05 + (twinkle * 0.5 + 0.5) * s.targetAlpha;

        // Slow multidirectional drift
        s.x += s.driftX * 0.4;
        s.y += s.driftY * 0.4;

        // Wrap around
        if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
        if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        if (s.x < -4) s.x = w + 4;
        if (s.x > w + 4) s.x = -4;

        // Parallax
        const parallaxOffset = scroll * s.depth * 0.15;
        const drawY = s.y - parallaxOffset;
        if (drawY < -10 || drawY > h + 10) continue;

        // Glow / bloom effect for glowing stars
        if (s.glowSize > 0) {
          const glowAlpha = s.alpha * 0.4;
          const pulseScale = 1 + twinkle * 0.15; // gentle pulse
          const glowRadius = s.glowSize * pulseScale;

          const gradient = ctx.createRadialGradient(s.x, drawY, 0, s.x, drawY, glowRadius);
          gradient.addColorStop(0, `hsla(${s.hue}, 100%, 80%, ${glowAlpha})`);
          gradient.addColorStop(0.4, `hsla(${s.hue}, 100%, 70%, ${glowAlpha * 0.5})`);
          gradient.addColorStop(1, `hsla(${s.hue}, 100%, 60%, 0)`);

          ctx.beginPath();
          ctx.arc(s.x, drawY, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Star core
        const coreScale = 0.8 + twinkle * 0.2; // subtle scale animation
        ctx.beginPath();
        ctx.arc(s.x, drawY, s.r * coreScale, 0, Math.PI * 2);
        const lightness = s.glowSize > 0 ? 90 : 85;
        ctx.fillStyle = `hsla(${s.hue}, 80%, ${lightness}%, ${s.alpha})`;
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

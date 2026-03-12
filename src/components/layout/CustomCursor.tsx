import { useEffect, useRef, useCallback } from "react";

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const lastMouse = useRef({ x: -100, y: -100 });
  const isHoveringButton = useRef(false);
  const isHoveringLink = useRef(false);
  const isHoveringCard = useRef(false);
  const visible = useRef(false);

  const spawnParticle = useCallback((x: number, y: number) => {
    const container = particleContainerRef.current;
    if (!container) return;
    const p = document.createElement("div");
    p.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:${2 + Math.random() * 2}px;
      height:${2 + Math.random() * 2}px;border-radius:50%;
      background:hsl(var(--primary));pointer-events:none;z-index:99998;
      opacity:0.8;transition:opacity 0.4s ease-out,transform 0.4s ease-out;
    `;
    container.appendChild(p);
    requestAnimationFrame(() => {
      p.style.opacity = "0";
      p.style.transform = `translate(${(Math.random() - 0.5) * 20}px,${(Math.random() - 0.5) * 20}px) scale(0)`;
    });
    setTimeout(() => p.remove(), 450);
  }, []);

  const spawnRipple = useCallback((x: number, y: number) => {
    const container = rippleContainerRef.current;
    if (!container) return;
    const r = document.createElement("div");
    r.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:0;height:0;
      border-radius:50%;border:2px solid hsl(var(--primary));
      pointer-events:none;z-index:99998;transform:translate(-50%,-50%);
      opacity:0.7;transition:width 0.5s ease-out,height 0.5s ease-out,opacity 0.5s ease-out;
    `;
    container.appendChild(r);
    requestAnimationFrame(() => {
      r.style.width = "60px";
      r.style.height = "60px";
      r.style.opacity = "0";
    });
    setTimeout(() => r.remove(), 550);
  }, []);

  const spawnSparks = useCallback((x: number, y: number) => {
    const container = rippleContainerRef.current;
    if (!container) return;
    const count = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const spark = document.createElement("div");
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 20 + Math.random() * 30;
      const size = 2 + Math.random() * 2;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      spark.style.cssText = `
        position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
        border-radius:50%;background:hsl(var(--primary));
        pointer-events:none;z-index:99998;
        opacity:1;transition:transform 0.4s cubic-bezier(.2,.8,.3,1),opacity 0.4s ease-out;
        box-shadow:0 0 4px hsl(var(--primary)/0.8);
        transform:translate(-50%,-50%);
      `;
      container.appendChild(spark);
      requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        spark.style.opacity = "0";
      });
      setTimeout(() => spark.remove(), 450);
    }
  }, []);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    document.documentElement.style.cursor = "none";
    const style = document.createElement("style");
    style.textContent = `*{cursor:none!important;}`;
    document.head.appendChild(style);

    let particleTimer = 0;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 8 && Date.now() - particleTimer > 30) {
        particleTimer = Date.now();
        spawnParticle(e.clientX, e.clientY);
      }
      lastMouse.current = { x: e.clientX, y: e.clientY };

      if (isHoveringCard.current) {
        const card = (e.target as HTMLElement).closest("[data-cursor-card]") as HTMLElement | null;
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
          card.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      spawnRipple(e.clientX, e.clientY);
      spawnSparks(e.clientX, e.clientY);
    };

    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, [role='button'], a[href], .register-btn")) {
        if (t.closest("button, [role='button'], .register-btn")) isHoveringButton.current = true;
        if (t.closest("a[href], nav a, [data-cursor-link]")) isHoveringLink.current = true;
      }
      if (t.closest("[data-cursor-card]")) isHoveringCard.current = true;
    };

    const onLeave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, [role='button'], a[href], .register-btn")) {
        isHoveringButton.current = false;
        isHoveringLink.current = false;
      }
      if (t.closest("[data-cursor-card]")) {
        isHoveringCard.current = false;
        const card = t.closest("[data-cursor-card]") as HTMLElement | null;
        if (card) {
          card.style.removeProperty("--spot-x");
          card.style.removeProperty("--spot-y");
        }
      }
    };

    const onMouseLeave = () => {
      visible.current = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    let raf: number;
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 4}px, ${mouse.current.y - 4}px)`;
      }

      if (ringRef.current) {
        const baseSize = isHoveringButton.current ? 44 : 32;
        const scaleX = isHoveringLink.current ? 1.3 : 1;
        const scaleY = isHoveringLink.current ? 0.85 : 1;
        const bg = isHoveringButton.current ? "hsl(var(--primary) / 0.15)" : "transparent";
        const shadow = isHoveringButton.current
          ? "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)"
          : "0 0 10px hsl(var(--primary) / 0.3)";
        const borderW = isHoveringButton.current ? "2.5px" : "1.5px";

        ringRef.current.style.transform = `translate(${ring.current.x - baseSize / 2}px, ${ring.current.y - baseSize / 2}px) scaleX(${scaleX}) scaleY(${scaleY})`;
        ringRef.current.style.width = `${baseSize}px`;
        ringRef.current.style.height = `${baseSize}px`;
        ringRef.current.style.background = bg;
        ringRef.current.style.boxShadow = shadow;
        ringRef.current.style.borderWidth = borderW;
      }

      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);
    document.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf);
      document.documentElement.style.cursor = "";
      style.remove();
    };
  }, [spawnParticle, spawnRipple, spawnSparks]);

  if (typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "hsl(var(--primary))",
          boxShadow: "0 0 8px hsl(var(--primary) / 0.7), 0 0 20px hsl(var(--primary) / 0.3)",
          pointerEvents: "none",
          zIndex: 99999,
          opacity: 0,
          transition: "opacity 0.3s",
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid hsl(var(--primary) / 0.6)",
          boxShadow: "0 0 10px hsl(var(--primary) / 0.3)",
          pointerEvents: "none",
          zIndex: 99999,
          opacity: 0,
          transition: "width 0.3s, height 0.3s, background 0.3s, box-shadow 0.3s, border-width 0.3s, opacity 0.3s",
          willChange: "transform",
        }}
      />
      <div ref={rippleContainerRef} />
      <div ref={particleContainerRef} />
    </>
  );
};

export default CustomCursor;

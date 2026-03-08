import { useState, useEffect } from "react";

const PageLoader = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const hideTimer = setTimeout(() => setVisible(false), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6 pointer-events-none"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease-out",
      }}
    >
      <div className="loader-wrapper">
        <div className="packman" />
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
      <p className="text-sm text-primary tracking-widest animate-pulse"></p>
    </div>
  );
};

export default PageLoader;

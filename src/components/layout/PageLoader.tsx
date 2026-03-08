import { useState, useEffect } from "react";

const PageLoader = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6 animate-out fade-out duration-500 fill-mode-forwards pointer-events-none" style={{ animationDelay: "2s" }}>
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

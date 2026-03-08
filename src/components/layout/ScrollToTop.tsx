import { useEffect, useState } from "react";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroSection = document.querySelector("#home");
      const heroHeight = heroSection instanceof HTMLElement ? heroSection.offsetHeight : window.innerHeight;
      setVisible(window.scrollY > heroHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 right-6 z-40">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="btt-btn"
        aria-label="Back to top"
      >
        <div className="btt-text">
          <span>Back</span>
          <span>to</span>
          <span>top</span>
        </div>
        <div className="btt-clone">
          <span>Back</span>
          <span>to</span>
          <span>top</span>
        </div>
        <svg
          strokeWidth={2}
          stroke="currentColor"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="btt-icon"
        >
          <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default ScrollToTop;

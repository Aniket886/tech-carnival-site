import { useState, useEffect } from "react";
import "./ThemeToggle.css";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light-theme", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <label className="theme-switch">
      <input
        type="checkbox"
        className="theme-switch__checkbox"
        checked={isDark}
        onChange={() => setIsDark(!isDark)}
      />
      <div className="theme-switch__container">
        <div className="theme-switch__clouds">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--light" id="cloud-1">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--light" id="cloud-2">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--light" id="cloud-3">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--dark" id="cloud-4">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--dark" id="cloud-5">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 26" className="theme-switch__cloud theme-switch__cloud--dark" id="cloud-6">
            <path d="M4 19.5A4.5 4.5 0 018.5 15h.5a5 5 0 019.8-1.4A3.5 3.5 0 0122 20H5.5A4.5 4.5 0 014 19.5z" fill="currentColor" />
          </svg>
        </div>
        <div className="theme-switch__stars">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-switch__star" id="star-1">
            <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-switch__star" id="star-2">
            <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-switch__star" id="star-3">
            <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-switch__star" id="star-4">
            <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor" />
          </svg>
        </div>
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon">
            {/* Light rays for sun */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="theme-switch__light-ray" id="light-ray-1">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {/* Moon craters */}
            <div className="theme-switch__moon-dot" id="moon-dot-1" />
            <div className="theme-switch__moon-dot" id="moon-dot-2" />
            <div className="theme-switch__moon-dot" id="moon-dot-3" />
          </div>
        </div>
      </div>
    </label>
  );
};

export default ThemeToggle;

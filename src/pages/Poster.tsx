import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "@/styles/poster.css";
import posterQr from "@/assets/poster-qr.png";

const events = [
  { emoji: "💻", name: "Hack Momentum", type: "Hackathon", cls: "ec1" },
  { emoji: "🧠", name: "Brain Quest", type: "Technical Quiz", cls: "ec2" },
  { emoji: "🎨", name: "Pixel Perfect", type: "Design Challenge", cls: "ec3" },
  { emoji: "🧭", name: "Code Compass", type: "Coding Competition", cls: "ec4" },
  { emoji: "💡", name: "Myth Busters", type: "Challenge Event", cls: "ec5" },
  { emoji: "🔬", name: "Scitopia", type: "Science Event", cls: "ec6" },
  { emoji: "🕺", name: "Dance Mania", type: "Cultural Event", cls: "ec7" },
  { emoji: "🎮", name: "Battle Ground", type: "Gaming", cls: "ec8" },
];

const Poster = () => {
  useEffect(() => {
    // Generate stars
    const starsEl = document.getElementById("poster-stars");
    if (!starsEl) return;
    starsEl.innerHTML = "";
    for (let i = 0; i < 120; i++) {
      const s = document.createElement("div");
      s.className = "poster-star";
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --d: ${2 + Math.random() * 4}s;
        animation-delay: ${Math.random() * 4}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
      `;
      starsEl.appendChild(s);
    }
    return () => { if (starsEl) starsEl.innerHTML = ""; };
  }, []);

  return (
    <div className="poster-page">
      <div className="poster-stars" id="poster-stars" />
      <div className="poster-scan-corner tl" />
      <div className="poster-scan-corner tr" />
      <div className="poster-scan-corner bl" />
      <div className="poster-scan-corner br" />

      {/* Back button */}
      <Link
        to="/"
        className="poster-back-btn"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="poster-container">
        {/* Header */}
        <p className="poster-university-tag">GM University · Davanagere</p>
        <p className="poster-faculty-tag">Faculty of Computing & IT · School of Computer Applications</p>

        {/* Hero */}
        <div className="poster-hero">
          <span className="poster-hero-rocket">🚀</span>
          <div className="poster-hero-title">
            TECH CARNIVAL
            <div className="poster-glitch-layer">TECH CARNIVAL</div>
          </div>
          <div className="poster-hero-year">2K26</div>
          <div className="poster-hero-subtitle">National Level Technical Competition · UG Students</div>
        </div>

        <div className="poster-divider">
          <div className="poster-divider-line" />
          <div className="poster-divider-dot" />
          <div className="poster-divider-line" />
        </div>

        {/* Meta Bar */}
        <div className="poster-meta-bar">
          <div className="poster-meta-item">
            <span className="poster-meta-icon">📅</span>
            <span className="poster-meta-label">Date</span>
            <span className="poster-meta-value">27 & 28 MAR 2026</span>
          </div>
          <div className="poster-meta-item">
            <span className="poster-meta-icon">📍</span>
            <span className="poster-meta-label">Venue</span>
            <span className="poster-meta-value">GMU CAMPUS</span>
          </div>
          <div className="poster-meta-item">
            <span className="poster-meta-icon">🎓</span>
            <span className="poster-meta-label">Level</span>
            <span className="poster-meta-value">NATIONAL</span>
          </div>
        </div>

        {/* Events */}
        <p className="poster-section-heading">◈ Competing Events ◈</p>
        <div className="poster-events-grid">
          {events.map((e) => (
            <div key={e.name} className={`poster-event-card ${e.cls}`}>
              <span className="poster-event-emoji">{e.emoji}</span>
              <div className="poster-event-name">{e.name}</div>
              <div className="poster-event-type">{e.type}</div>
            </div>
          ))}
        </div>

        {/* Prize */}
        <div className="poster-prize-banner">
          <div className="poster-prize-amount">₹50,000+</div>
          <div className="poster-prize-label">◈ Total Prize Pool ◈</div>
          <div className="poster-prize-extra">🏆 General Championship Trophy · All Participants: Certificates</div>
        </div>

        {/* Bottom Row */}
        <div className="poster-bottom-row">
          <div>
            <div className="poster-register-block">
              <div className="poster-register-label">Register Now</div>
              <div className="poster-register-url">techcarnival.online</div>
            </div>
            <div className="poster-contact-block">
              <div className="poster-contact-line">📞 <span>+91 9380474080</span> · <span>9845642942</span></div>
              <div className="poster-contact-line">Organizing Team – Tech Carnival 2K26</div>
            </div>
          </div>
          <div className="poster-qr-wrapper">
            <div className="poster-qr-box">
              <span className="poster-qr-icon">📱</span>
              <div className="poster-qr-text">SCAN TO<br />REGISTER</div>
            </div>
            <div className="poster-qr-label">Scan to Register</div>
          </div>
        </div>

        {/* Footer */}
        <div className="poster-footer-redesigned">
          <div className="poster-footer-trophy-card">
            <div className="poster-trophy-glow" />
            <span className="poster-trophy-icon">🏆</span>
            <div className="poster-trophy-text">
              <span className="poster-trophy-title">GENERAL CHAMPIONSHIP</span>
              <span className="poster-trophy-sub">Trophy Awaits the Best</span>
            </div>
          </div>
          <div className="poster-footer-cert-card">
            <div className="poster-cert-dot-pulse" />
            <span className="poster-cert-icon">📜</span>
            <span className="poster-cert-text">All Participants Receive Certificates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Poster;

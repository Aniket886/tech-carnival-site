import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface EyeFollowButtonProps {
  text?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  eyeCount?: 1 | 2;
  eyeSize?: number;
  pupilSize?: number;
  eyeGap?: number;
}

const Eye = ({
  size,
  pupilSize,
  pupilX,
  pupilY,
  blink,
}: {
  size: number;
  pupilSize: number;
  pupilX: number;
  pupilY: number;
  blink: boolean;
}) => {
  const maxOffset = (size - pupilSize) / 2 - 2;
  const clampedX = Math.max(-maxOffset, Math.min(maxOffset, pupilX));
  const clampedY = Math.max(-maxOffset, Math.min(maxOffset, pupilY));

  return (
    <motion.div
      className="rounded-full bg-white flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      animate={{ scaleY: blink ? 0.1 : 1 }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        className="rounded-full"
        style={{ width: pupilSize, height: pupilSize, backgroundColor: "#000" }}
        animate={{ x: clampedX, y: clampedY }}
        transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.5 }}
      />
    </motion.div>
  );
};

const EyeFollowButton = ({
  text = "Send Message",
  onClick,
  disabled = false,
  loading = false,
  type = "submit",
  className = "",
  eyeCount = 2,
  eyeSize = 36,
  pupilSize = 12,
  eyeGap = 4,
}: EyeFollowButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.right - (eyeCount === 2 ? eyeSize + eyeGap / 2 : eyeSize / 2) - 6;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = (eyeSize - pupilSize) / 2 - 2;
      const factor = Math.min(1, dist / 200);
      setPupilOffset({
        x: (dx / (dist || 1)) * maxMove * factor,
        y: (dy / (dist || 1)) * maxMove * factor,
      });
    },
    [eyeSize, pupilSize, eyeCount, eyeGap]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const eyes = Array.from({ length: eyeCount }, (_, i) => (
    <Eye
      key={i}
      size={eyeSize}
      pupilSize={pupilSize}
      pupilX={pupilOffset.x}
      pupilY={pupilOffset.y}
      blink={blink}
    />
  ));

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn-golden inline-flex items-center justify-between gap-3 w-full h-12 pl-5 pr-1.5 py-1.5 rounded-full text-sm font-bold tracking-wider disabled:pointer-events-none disabled:opacity-50 transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-primary">{loading ? "Sending..." : text}</span>
      <div className="flex items-center" style={{ gap: eyeGap }}>
        {eyes}
      </div>
    </motion.button>
  );
};

export default EyeFollowButton;

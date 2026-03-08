import { useRef, useState, useCallback, type ReactNode } from "react";

interface MagneticWrapperProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

const MagneticWrapper = ({ children, strength = 0.3, className = "" }: MagneticWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("translate3d(0,0,0)");

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      setTransform(`translate3d(${x}px, ${y}px, 0)`);
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("translate3d(0,0,0)");
  }, []);

  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: "transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)", willChange: "transform" }}
    >
      {children}
    </div>
  );
};

export default MagneticWrapper;

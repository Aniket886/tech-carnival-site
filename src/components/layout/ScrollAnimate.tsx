import { useEffect, useRef, type ReactNode } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface ScrollAnimateProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const ScrollAnimate = ({ children, className, delay = 0 }: ScrollAnimateProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={controls} variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay } } }}>
      {children}
    </motion.div>
  );
};

export default ScrollAnimate;

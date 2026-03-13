import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const eventDate = new Date("2026-03-27T09:00:00");

  const calculateTimeLeft = (): TimeLeft => {
    const difference = eventDate.getTime() - new Date().getTime();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 sm:gap-5">
      {units.map(({ label, value }) => {
        const digits = String(value).padStart(2, "0");
        return (
          <div key={label} className="flex flex-col items-center gap-2">
            {/* Outer bezel */}
            <div
              className="relative w-[68px] h-[78px] sm:w-[84px] sm:h-[96px] rounded-xl"
              style={{
                background: "linear-gradient(180deg, hsl(210 10% 30%) 0%, hsl(210 10% 14%) 100%)",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
                padding: "3px",
              }}
            >
              {/* Inner face */}
              <div
                className="relative w-full h-full rounded-[9px] flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, hsl(210 8% 10%) 0%, hsl(210 12% 6%) 100%)",
                  boxShadow:
                    "inset 0 2px 6px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Flip-card center seam */}
                <div
                  className="absolute inset-x-0 top-1/2 h-px -translate-y-px"
                  style={{
                    background: "linear-gradient(90deg, transparent 8%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0.7) 80%, transparent 92%)",
                  }}
                />
                <div
                  className="absolute inset-x-0 top-1/2 h-px translate-y-px"
                  style={{
                    background: "linear-gradient(90deg, transparent 8%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent 92%)",
                  }}
                />

                {/* Digit display */}
                <div className="flex gap-[2px]">
                  {digits.split("").map((d, i) => (
                    <span
                      key={i}
                      className="text-2xl sm:text-3xl font-black tabular-nums"
                      style={{
                        color: "hsl(var(--primary))",
                        textShadow: "0 0 12px hsl(var(--primary) / 0.5), 0 1px 2px rgba(0,0,0,0.8)",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Top highlight gloss */}
                <div
                  className="absolute inset-x-1 top-1 h-[45%] rounded-t-md pointer-events-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
                  }}
                />

                {/* Corner screws */}
                {[
                  "top-[5px] left-[5px]",
                  "top-[5px] right-[5px]",
                  "bottom-[5px] left-[5px]",
                  "bottom-[5px] right-[5px]",
                ].map((pos, i) => (
                  <div
                    key={i}
                    className={`absolute ${pos} w-[5px] h-[5px] rounded-full`}
                    style={{
                      background: "radial-gradient(circle at 35% 35%, hsl(210 8% 35%), hsl(210 8% 15%))",
                      boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.15), 0 0.5px 1px rgba(0,0,0,0.4)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Label plate */}
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded"
              style={{
                color: "hsl(210 10% 55%)",
                background: "linear-gradient(180deg, hsl(210 10% 16%) 0%, hsl(210 10% 12%) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CountdownTimer;

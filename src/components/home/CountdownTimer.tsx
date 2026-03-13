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
    <div className="flex gap-4 sm:gap-6">
      {units.map(({ label, value }) => {
        const digits = String(value).padStart(2, "0");
        return (
          <div key={label} className="flex flex-col items-center gap-2.5">
            {/* Clay tile */}
            <div
              className="relative w-[72px] h-[82px] sm:w-[88px] sm:h-[100px] rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.10) 100%)",
                boxShadow:
                  "8px 8px 16px rgba(0,0,0,0.45), -4px -4px 12px rgba(255,255,255,0.04), inset -3px -3px 6px rgba(0,0,0,0.2), inset 3px 3px 6px hsl(var(--primary) / 0.12)",
                border: "1px solid hsl(var(--primary) / 0.15)",
                borderRadius: "20px",
              }}
            >
              {/* Inner soft highlight */}
              <div
                className="absolute inset-0 rounded-[19px] pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                }}
              />

              {/* Digit */}
              <span
                className="relative text-2xl sm:text-4xl font-black tabular-nums"
                style={{
                  color: "hsl(var(--primary))",
                  textShadow: "0 2px 4px rgba(0,0,0,0.4), 0 0 20px hsl(var(--primary) / 0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                {digits}
              </span>
            </div>

            {/* Clay label */}
            <span
              className="text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase px-3 py-1 rounded-full"
              style={{
                color: "hsl(var(--primary) / 0.8)",
                background: "linear-gradient(145deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.05) 100%)",
                boxShadow:
                  "4px 4px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(255,255,255,0.03), inset -1px -1px 3px rgba(0,0,0,0.15), inset 1px 1px 3px hsl(var(--primary) / 0.08)",
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

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
    <div className="flex gap-3 sm:gap-6">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="glass neon-border rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-primary text-glow">
              {String(value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium tracking-wider uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;

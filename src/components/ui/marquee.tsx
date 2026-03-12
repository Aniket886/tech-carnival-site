import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  applyMask?: boolean;
}

export default function Marquee({
  children,
  vertical = false,
  repeat = 5,
  pauseOnHover = false,
  reverse = false,
  className,
  applyMask = true,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group relative flex h-full w-full p-2 [--duration:10s] [--gap:12px] [gap:var(--gap)]",
        {
          "flex-col": vertical,
          "flex-row": !vertical,
          "overflow-x-hidden": !vertical,
          "overflow-y-hidden": vertical,
        },
        className
      )}
    >
      {applyMask && (
        <div
          className={cn("pointer-events-none absolute z-10", {
            "inset-x-0 h-1/4": vertical,
            "inset-y-0 w-1/6": !vertical,
          })}
          style={{
            background: vertical
              ? "linear-gradient(to bottom, hsl(var(--background)), transparent, transparent, hsl(var(--background)))"
              : "linear-gradient(to right, hsl(var(--background)), transparent, transparent, hsl(var(--background)))",
            ...(vertical ? { top: 0, bottom: 0 } : { left: 0, right: 0 }),
            width: vertical ? undefined : "100%",
            height: vertical ? "100%" : undefined,
          }}
        />
      )}
      {Array.from({ length: repeat }).map((_, idx) => (
        <div
          key={idx}
          className={cn("flex shrink-0 [gap:var(--gap)]", {
            "animate-[marquee-x_var(--duration)_linear_infinite]": !vertical && !reverse,
            "animate-[marquee-x_var(--duration)_linear_infinite_reverse]": !vertical && reverse,
            "animate-[marquee-y_var(--duration)_linear_infinite]": vertical && !reverse,
            "animate-[marquee-y_var(--duration)_linear_infinite_reverse]": vertical && reverse,
            "flex-col": vertical,
            "flex-row": !vertical,
            "group-hover:[animation-play-state:paused]": pauseOnHover,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export function Marquee({
  children,
  speed = 32,
  reverse = false,
}: {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
}) {
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div
        className="flex w-max gap-5 will-change-transform [animation-name:marquee] [animation-timing-function:linear] [animation-iteration-count:infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation:none]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

import clsx from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("card rounded-xl border border-border bg-surface p-5 transition-shadow duration-300", className)}
      {...props}
    />
  );
}

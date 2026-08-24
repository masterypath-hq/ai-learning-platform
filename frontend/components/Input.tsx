import { forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted-2 focus:border-[var(--accent)]",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
});
Input.displayName = "Input";

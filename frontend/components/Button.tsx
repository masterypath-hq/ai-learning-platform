import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[color,background-color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
          sizeClasses[size],
          variant === "primary" &&
            "bg-[var(--accent)] text-[var(--accent-foreground)] hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/25 active:translate-y-0",
          variant === "secondary" &&
            "border border-border-strong bg-surface text-foreground hover:-translate-y-0.5 hover:bg-surface-hover hover:shadow-md active:translate-y-0",
          variant === "ghost" && "text-muted hover:bg-surface hover:text-foreground",
          variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
          className
        )}
        {...props}
      >
        {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

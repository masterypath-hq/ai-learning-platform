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
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          variant === "primary" &&
            "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]",
          variant === "secondary" &&
            "border border-border-strong bg-surface text-foreground hover:bg-surface-hover",
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

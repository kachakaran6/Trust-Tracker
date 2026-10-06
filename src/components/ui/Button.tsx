import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger-ghost"
  | "danger"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:brightness-95 shadow-sm",
    secondary:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] shadow-sm",
    outline:
      "bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]",
    ghost:
      "bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]",
    "danger-ghost":
      "bg-transparent text-[var(--danger)] hover:bg-[var(--danger-subtle)] active:bg-[var(--danger-subtle)]",
    danger:
      "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] active:brightness-95 shadow-sm",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "ghost" | "secondary" | "danger-ghost" | "primary";
  size?: "sm" | "md" | "lg";
  icon: React.ReactNode;
  title?: string;
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  "aria-label": ariaLabel,
  variant = "ghost",
  size = "md",
  icon,
  title,
  isLoading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0";

  const variantStyles = {
    ghost:
      "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]",
    secondary:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] shadow-sm",
    "danger-ghost":
      "bg-transparent text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] active:bg-[var(--danger-subtle)]",
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:brightness-95 shadow-sm",
  };

  const sizeStyles = {
    sm: "w-8 h-8 p-1 text-xs",
    md: "w-10 h-10 p-2 text-sm",
    lg: "w-12 h-12 p-3 text-base",
  };

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
    </button>
  );
};

export default Button;

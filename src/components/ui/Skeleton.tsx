import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded-xs w-full",
    rectangular: "rounded-sm w-full",
    circular: "rounded-full shrink-0",
  };

  return (
    <div
      className={`animate-pulse bg-[var(--surface-muted)] ${variantStyles[variant]} ${className}`.trim()}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export default Skeleton;

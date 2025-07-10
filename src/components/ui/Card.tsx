import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  variant?: "default" | "glass" | "gradient";
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  isLoading?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant = "default",
  title,
  subtitle,
  icon,
  children,
  className = "",
  onClick,
  hoverEffect = false,
  isLoading = false,
}) => {
  // const baseClasses =
  //   "rounded-lg overflow-hidden p-6 transition-all duration-300 shadow-lg";
  // const variantClasses = {
  //   default: "bg-white border border-white/80 shadow-sm shadow-white/20",

  //   glass:
  //     "bg-white/70 backdrop-blur-md border border-white/50 shadow-md shadow-white/30",
  // };

  // const classes = `${baseClasses} ${variantClasses[variant]} ${
  //   hoverEffect
  //     ? "cursor-pointer hover:shadow-xl dark:hover:shadow-xl transform hover:-translate-y-1"
  //     : ""
  // } ${className}`;

  const getCardStyles = () => {
    const baseStyles =
      "rounded-2xl overflow-hidden p-6 transition-all duration-300";

    switch (variant) {
      case "glass":
        return `${baseStyles} bg-white/70 backdrop-blur-lg backdrop-blur-xl border-2 border-white/20 shadow-lg shadow-white/30`;
      // glass-card backdrop-blur-lg  backdrop-blur-xl border-2 border-white/20"
      case "gradient":
        return `${baseStyles} gradient-border bg-white`;
      default:
        return `${baseStyles} bg-white border border-white/80 shadow-sm shadow-white/20`;
    }
  };

  const cardStyles = `${getCardStyles()} ${
    hoverEffect
      ? "hover:shadow-card-hover dark:hover:shadow-card-hover-dark transform hover:-translate-y-1"
      : ""
  } ${className}`;

  return (
    <motion.div
      className={cardStyles}
      onClick={onClick}
      whileHover={
        hoverEffect ? { y: -4, boxShadow: "0 15px 30px rgba(0,0,0,0.15)" } : {}
      }
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (
        <div className="flex flex-col space-y-4 animate-pulse">
          <div className="h-6 bg-neutral-200  rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200  rounded w-1/2"></div>
          <div className="h-24 bg-neutral-200  rounded"></div>
        </div>
      ) : (
        <>
          {(title || icon) && (
            <div className="flex items-center justify-between mb-4">
              {title && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              {icon && (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  {icon}
                </div>
              )}
            </div>
          )}
          {children}
        </>
      )}
    </motion.div>
  );
};

export default Card;

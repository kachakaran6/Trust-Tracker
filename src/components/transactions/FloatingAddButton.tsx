import React from "react";
import { Plus } from "lucide-react";

interface FloatingAddButtonProps {
  onClick: () => void;
  title?: string;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onClick,
  title = "Quick Add Transaction",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center z-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
    >
      <Plus size={22} strokeWidth={2} />
    </button>
  );
};

export default FloatingAddButton;

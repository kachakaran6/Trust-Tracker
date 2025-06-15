import React from "react";
import { Plus } from "lucide-react";

interface FloatingAddButtonProps {
  onClick: () => void;
}

function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 group"
      title="Add Transaction"
    >
      <Plus size={24} className="group-hover:scale-110 transition-transform" />
    </button>
  );
}

export default FloatingAddButton;

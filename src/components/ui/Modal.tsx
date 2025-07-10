import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative border border-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-900"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-neutral-800">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;

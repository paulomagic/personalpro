import React from 'react';

interface AIBuilderErrorToastProps {
  message: string;
  onClose: () => void;
}

const AIBuilderErrorToast: React.FC<AIBuilderErrorToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-red-400/30 flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

export default AIBuilderErrorToast;

import React, { useEffect, useRef } from 'react';

export default function Modal({ visible, title, children, onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', onKey);
    // focus the close button for accessibility
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-95 opacity-0 animate-modal-in"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="ml-4 text-gray-600 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-700">{children}</div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-in { animation: modalIn 220ms ease-out forwards; }
      `}</style>
    </div>
  );
}

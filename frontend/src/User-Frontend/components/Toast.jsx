import React from 'react';

export default function Toast({ visible, message }) {
  return (
    <div aria-live="polite" className="fixed inset-0 flex items-end justify-center pointer-events-none z-50 px-4 pb-6">
      <div className={`max-w-xs w-full bg-black bg-opacity-85 text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 pointer-events-auto ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
        {message}
      </div>
      <style>{`
        .translate-y-6 { transform: translateY(24px); }
      `}</style>
    </div>
  );
}

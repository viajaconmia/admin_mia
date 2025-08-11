// components/ui/BaseModal.tsx
'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type BaseModalProps = {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-4xl"
  disableBackdropClose?: boolean;
};

export default function BaseModal({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-3xl",
  disableBackdropClose = false,
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cerrar con ESC y bloquear scroll del cuerpo
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  // Focus trap mínimo
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    const focusables = el?.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-fadeIn"
        onClick={() => { if (!disableBackdropClose) onClose(); }}
      />
      {/* Panel */}
      <div
        ref={dialogRef}
        className={`relative w-full ${maxWidthClass} bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 animate-scaleIn`}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="sticky top-0 bg-white rounded-t-2xl border-b px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {title && (
                  <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Body scrollable */}
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-white rounded-b-2xl border-t px-5 py-3">
            <div className="flex items-center justify-end gap-2">{footer}</div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn { animation: fadeIn .15s ease forwards; }
        .animate-scaleIn { animation: scaleIn .18s ease forwards; }
        @keyframes fadeIn { from {opacity:0} to {opacity:1} }
        @keyframes scaleIn { from {opacity:0; transform:scale(.98)} to {opacity:1; transform:scale(1)} }
      `}</style>
    </div>
  );
}

// Modal component for TeamMatch
// Reusable overlay for confirmation dialogs (e.g., invite confirmation)

import React from 'react';
import PrimaryButton from './ui/PrimaryButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-surface rounded-card p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-subheading font-semibold text-primary-500 mb-4">
          {title}
        </h2>

        <div className="mb-6">{children}</div>

        <div className="flex gap-3">
          <PrimaryButton label={cancelText} variant="secondary" onClick={onClose} className="flex-1" />
          <PrimaryButton label={confirmText} onClick={onConfirm} className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default Modal;
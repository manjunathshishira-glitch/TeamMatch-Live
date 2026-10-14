// PrimaryButton - Reusable button component based on Figma "Button/Primary"
// Supports primary (filled) and secondary (outlined) variants

import React from 'react';

interface PrimaryButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  type = 'button',
  className = '',
}) => {
  const base = 'h-12 px-6 rounded-xl text-subheading font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 inline-flex items-center justify-center';

  const variantClasses =
    variant === 'primary'
      ? 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500'
      : 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50 active:bg-primary-100 disabled:opacity-50';

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClasses} ${widthClass} ${disabledClass} ${className}`.trim()}
    >
      {label}
    </button>
  );
};

export default PrimaryButton;
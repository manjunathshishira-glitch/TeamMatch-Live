// InputField - Reusable text input component based on Figma "Input/Text"
// Renders a visible label, input, and optional helper/error text with aria support

import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder = '',
  helperText,
  error,
  required = false,
  className = '',
}) => {
  const inputId = name;
  const errorId = `${name}-error`;
  const helperId = `${name}-helper`;

  const inputClasses = [
    'input-field',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none',
    error ? 'border-red-500 focus:border-red-500' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={inputId} className="input-label">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={inputClasses}
      />
      {error && (
        <p id={errorId} className="input-error">{error}</p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-text-muted text-caption mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default InputField;
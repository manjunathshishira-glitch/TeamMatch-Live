// ChipSelector - Reusable chip/toggle component based on Figma "Chip/Skill"
// Supports multi (checkboxes) and single (radio) selection modes, plus read-only display

import React from 'react';

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  mode?: 'multi' | 'single';
  readOnly?: boolean;
  readOnlyVariant?: 'default' | 'light';
  label?: string;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  options,
  selected,
  onChange,
  mode = 'multi',
  readOnly = false,
  readOnlyVariant = 'default',
  label,
}) => {
  const handleClick = (option: string) => {
    if (readOnly) return;
    if (mode === 'single') {
      onChange(selected.includes(option) ? [] : [option]);
    } else {
      onChange(
        selected.includes(option)
          ? selected.filter(s => s !== option)
          : [...selected, option]
      );
    }
  };

  const getChipClass = (isSelected: boolean) => {
    if (readOnly && readOnlyVariant === 'light') {
      return isSelected
        ? 'inline-flex items-center px-3 py-1 rounded-chip text-caption bg-primary-50 text-primary-500 font-medium'
        : 'inline-flex items-center px-3 py-1 rounded-chip text-caption bg-gray-100 text-gray-400 font-medium';
    }
    return `chip${isSelected ? ' chip-selected' : ''}${readOnly ? ' cursor-default' : ''}`;
  };

  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      <div role={mode === 'single' ? 'radiogroup' : 'group'} className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              role={mode === 'single' ? 'radio' : 'checkbox'}
              aria-checked={isSelected}
              disabled={readOnly}
              onClick={() => handleClick(option)}
              className={getChipClass(isSelected)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChipSelector;
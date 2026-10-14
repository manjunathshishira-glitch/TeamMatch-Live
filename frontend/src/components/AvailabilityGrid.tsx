// AvailabilityGrid component for TeamMatch
// Displays a 7x3 grid for selecting availability slots

import React from 'react';
import { weekDays, timeSlots } from '../data/mockStudents';

interface AvailabilityGridProps {
  selectedSlots: Record<string, string[]>;
  onToggle: (day: string, time: string) => void;
  readOnly?: boolean;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  selectedSlots,
  onToggle,
  readOnly = false,
}) => {
  const isSelected = (day: string, time: string) => {
    return selectedSlots[day]?.includes(time) || false;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2"></th>
            {weekDays.map((day) => (
              <th
                key={day}
                className="p-2 text-caption font-semibold text-text-body text-center"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="p-2 text-caption font-medium text-text-muted pr-4">
                {time}
              </td>
              {weekDays.map((day) => (
                <td key={`${day}-${time}`} className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => !readOnly && onToggle(day, time)}
                    disabled={readOnly}
                    className={`w-10 h-10 rounded-lg transition-all duration-200 border ${
                      isSelected(day, time)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-400 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    aria-label={`${day} ${time}`}
                    aria-pressed={isSelected(day, time)}
                  >
                    {isSelected(day, time) ? '✓' : ''}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AvailabilityGrid;
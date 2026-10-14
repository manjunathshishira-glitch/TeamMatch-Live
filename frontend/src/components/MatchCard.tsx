// MatchCard component for TeamMatch
// Displays a teammate card with name, course, skills, compatibility score, and reason

import React, { useState } from 'react';
import type { MatchResult, MockStudent } from '../types';
import AvailabilityGrid from './AvailabilityGrid';
import PrimaryButton from './ui/PrimaryButton';
import ChipSelector from './ui/ChipSelector';

interface MatchCardProps {
  match: MatchResult;
  onInvite: (student: MockStudent) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onInvite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { student, score, reason } = match;

  return (
    <div className="card p-4 mb-4">
      {/* Header with avatar and basic info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold text-subheading">
          {student.avatarInitials}
        </div>
        <div className="flex-1">
          <h3 className="text-subheading font-semibold text-primary-500">
            {student.name}
          </h3>
          <p className="text-caption text-text-muted">{student.course}</p>
        </div>
        <div className="text-right">
          <div className="text-heading font-bold text-primary-500">{score}%</div>
          <p className="text-caption text-text-muted">match</p>
        </div>
      </div>

      {/* Skills chips */}
      <ChipSelector options={student.skills} selected={student.skills}
        onChange={() => {}} mode="multi" readOnly readOnlyVariant="light" />

      {/* Reason line */}
      <p className="text-caption text-text-muted mb-3">{reason}</p>

      {/* Expand/Collapse button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-caption text-accent font-medium hover:underline mb-2"
      >
        {isExpanded ? '← Hide Profile' : 'View Profile →'}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h4 className="text-caption font-semibold text-text-body mb-2">
            Availability
          </h4>
          <AvailabilityGrid
            selectedSlots={student.availability}
            onToggle={() => {}}
            readOnly={true}
          />

          <h4 className="text-caption font-semibold text-text-body mt-4 mb-2">
            Working Style
          </h4>
          <div className="space-y-2 text-caption text-text-muted">
            <p>
              <span className="font-medium text-text-body">Study preference:</span>{' '}
              {student.studyPreference}
            </p>
            <p>
              <span className="font-medium text-text-body">Commitment:</span>{' '}
              {student.commitment}
            </p>
            <p>
              <span className="font-medium text-text-body">Meeting frequency:</span>{' '}
              {student.meetingFrequency}
            </p>
          </div>
        </div>
      )}

      {/* Invite button */}
      <PrimaryButton label="Invite to Group" onClick={() => onInvite(student)} className="mt-4" />
    </div>
  );
};

export default MatchCard;
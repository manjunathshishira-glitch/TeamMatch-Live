// ResultScreen for TeamMatch
// Final screen: Shows success (group complete) or unsuccessful result

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { GroupMember, Assignment, Availability } from '../types';
import PrimaryButton from '../components/ui/PrimaryButton';
import Header from '../components/Header';

interface Props {
  groupMembers: GroupMember[];
  assignment: Assignment;
  availability: Availability;
}

const ResultScreen: React.FC<Props> = ({ groupMembers, assignment, availability }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { success: boolean; reason?: string } | null;

  const success = state?.success ?? false;
  const reason = state?.reason;

  // Find shared availability
  const sharedSlots = Object.entries(availability.slots)
    .map(([day, times]) => `${day} ${times.join(' & ')}`)
    .join(', ');

  if (success) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full max-w-[420px] mx-auto">
          <Header />
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-500 text-2xl">✓</span>
            </div>
            <h1 className="text-heading font-bold text-primary-500 mb-2">Your group is complete!</h1>
            <p className="text-subheading text-text-muted mb-6">{groupMembers.length} / {assignment.groupSize} members</p>
            
            <div className="text-left mb-6">
              <h2 className="text-subheading font-semibold text-primary-500 mb-3">Group members</h2>
              {groupMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-caption">
                    {m.avatarInitials}
                  </div>
                  <span className="text-body text-text-body">{m.name}</span>
                  <span className="ml-auto text-green-500">✓</span>
                </div>
              ))}
            </div>

            <div className="text-left mb-6">
              <h2 className="text-subheading font-semibold text-primary-500 mb-2">Group strengths</h2>
              <p className="text-body text-text-muted">Strong skill coverage across required areas</p>
            </div>

            <div className="text-left mb-6">
              <h2 className="text-subheading font-semibold text-primary-500 mb-2">Shared availability</h2>
              <p className="text-body text-text-muted">{sharedSlots || 'Flexible scheduling'}</p>
            </div>

            <PrimaryButton label="View Group" onClick={() => navigate('/')} />
          </div>
        </div>
      </div>
    );
  }

  // Unsuccessful or incomplete
  const remaining = assignment.groupSize - groupMembers.length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] mx-auto">
        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-500 text-2xl">!</span>
          </div>
          
          {reason === 'No teammate shares your availability' ? (
            <>
              <h1 className="text-heading font-bold text-primary-500 mb-2">No matches found</h1>
              <p className="text-body text-text-muted mb-6">{reason}</p>
              <div className="flex flex-col gap-3">
                <PrimaryButton label="Adjust availability" onClick={() => navigate('/availability')} />
                <PrimaryButton label="Start again" variant="secondary" onClick={() => navigate('/')} />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-heading font-bold text-primary-500 mb-2">
                {groupMembers.length} / {assignment.groupSize} members
              </h1>
              <p className="text-body text-text-muted mb-6">{remaining} member{remaining !== 1 ? 's' : ''} remaining</p>
              <div className="flex flex-col gap-3">
                <PrimaryButton label="Find another teammate" onClick={() => navigate('/matches')} />
                <PrimaryButton label="Start again" variant="secondary" onClick={() => navigate('/')} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
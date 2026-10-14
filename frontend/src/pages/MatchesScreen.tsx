// MatchesScreen for TeamMatch
// Step 4: Show ranked teammates with compatibility scores and invite flow

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Availability, Assignment, GroupMember, MockStudent } from '../types';
import { mockStudents } from '../data/mockStudents';
import { calculateAllMatches } from '../utils/matchScore';
import MatchCard from '../components/MatchCard';
import Modal from '../components/Modal';
import PrimaryButton from '../components/ui/PrimaryButton';
import Header from '../components/Header';
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '../components/ui/ProgressStepper';
import * as api from '../api/client';

interface Props {
  availability: Availability;
  assignment: Assignment;
  assignmentId: number | null;
  groupMembers: GroupMember[];
  onInvite: (member: GroupMember) => void;
  onComplete: () => void;
  onUnauthorized: () => void;
}

const MatchesScreen: React.FC<Props> = ({ availability, assignment, assignmentId, groupMembers, onInvite, onComplete, onUnauthorized }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const matches = useMemo(() => calculateAllMatches(mockStudents, availability, assignment), [availability, assignment]);

  // Check if any student shares availability
  const hasAvailableMatches = matches.some(m => m.score > 0);

  const handleInvite = (student: MockStudent) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const confirmInvite = async () => {
    if (!selectedStudent || inviting) return;
    setInviteError(null);
    setInviting(true);
    try {
      await api.createGroupMembers({
        ...(assignmentId !== null ? { assignmentId } : {}),
        members: [{ memberId: selectedStudent.id, memberName: selectedStudent.name }],
      });
      onInvite({ id: selectedStudent.id, name: selectedStudent.name, avatarInitials: selectedStudent.avatarInitials });
      setShowModal(false);
      setSelectedStudent(null);
      // Check if group is complete
      if (groupMembers.length + 1 >= assignment.groupSize) {
        onComplete();
        navigate('/result', { state: { success: true } });
      }
    } catch (err) {
      if (err instanceof api.UnauthorizedError) { onUnauthorized(); return; }
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const viewResult = () => {
    onComplete();
    if (groupMembers.length >= assignment.groupSize) {
      navigate('/result', { state: { success: true } });
    } else {
      navigate('/result', { state: { success: false, reason: 'Group not yet complete' } });
    }
  };

  // If no matches share availability, show early result
  if (!hasAvailableMatches) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full max-w-[420px] mx-auto">
          <Header />
          <Stepper value={3} className="mb-6">
            {[
              { step: 0, title: 'Profile' },
              { step: 1, title: 'Availability' },
              { step: 2, title: 'Assignment' },
              { step: 3, title: 'Matches' },
            ].map(({ step, title }) => (
              <StepperItem key={step} step={step} className="max-md:items-start [&:not(:last-child)]:flex-1">
                <StepperTrigger className="max-md:flex-col" tabIndex={-1}>
                  <StepperIndicator />
                  <div className="text-center md:text-left">
                    <StepperTitle className="text-caption">{title}</StepperTitle>
                  </div>
                </StepperTrigger>
                {step < 3 && <StepperSeparator className="max-md:mt-3.5 md:mx-2" />}
              </StepperItem>
            ))}
          </Stepper>
          <h1 className="text-heading font-bold text-primary-500 mb-6">Your best matches</h1>
          <div className="card p-6 text-center">
            <p className="text-subheading text-text-body mb-4">None of your potential teammates share your availability</p>
            <p className="text-body text-text-muted mb-6">Try adjusting your availability to find more matches.</p>
            <PrimaryButton label="See result" onClick={() => navigate('/result', { state: { success: false, reason: 'No teammate shares your availability' } })} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] mx-auto">
        <Header />
        <Stepper value={3} className="mb-6">
          {[
            { step: 0, title: 'Profile' },
            { step: 1, title: 'Availability' },
            { step: 2, title: 'Assignment' },
            { step: 3, title: 'Matches' },
          ].map(({ step, title }) => (
            <StepperItem key={step} step={step} className="max-md:items-start [&:not(:last-child)]:flex-1">
              <StepperTrigger className="max-md:flex-col" tabIndex={-1}>
                <StepperIndicator />
                <div className="text-center md:text-left">
                  <StepperTitle className="text-caption">{title}</StepperTitle>
                </div>
              </StepperTrigger>
              {step < 3 && <StepperSeparator className="max-md:mt-3.5 md:mx-2" />}
            </StepperItem>
          ))}
        </Stepper>
        <h1 className="text-heading font-bold text-primary-500 mb-6">Your best matches</h1>

        {/* Current group */}
        <div className="card p-4 mb-4">
          <h2 className="text-subheading font-semibold text-primary-500 mb-2">Your group</h2>
          <p className="text-caption text-text-muted">{groupMembers.length} / {assignment.groupSize} members</p>
          <div className="flex gap-2 mt-2">
            {groupMembers.map(m => (
              <div key={m.id} className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-caption">
                {m.avatarInitials}
              </div>
            ))}
          </div>
        </div>

        {/* Match cards */}
        {matches.map(match => (
          <MatchCard key={match.student.id} match={match} onInvite={handleInvite} />
        ))}

        <PrimaryButton label="View Result" variant="secondary" onClick={viewResult} className="mt-4" />
      </div>

      {/* Invite modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setInviteError(null); }} onConfirm={confirmInvite}
        title={`Invite ${selectedStudent?.name} to your group?`} confirmText={inviting ? 'Sending…' : 'Send Invitation'}>
        <p className="text-body text-text-muted">Group: {groupMembers.length + 1} / {assignment.groupSize} members</p>
        <p className="text-caption text-text-muted mt-1">({groupMembers.map(m => m.name).join(', ')})</p>
        {inviteError && <p className="input-error mt-2">{inviteError}</p>}
      </Modal>
    </div>
  );
};

export default MatchesScreen;
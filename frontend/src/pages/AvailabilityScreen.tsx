// AvailabilityScreen for TeamMatch
// Step 2: Set availability slots and meeting frequency

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Availability } from '../types';
import AvailabilityGrid from '../components/AvailabilityGrid';
import PrimaryButton from '../components/ui/PrimaryButton';
import ChipSelector from '../components/ui/ChipSelector';
import Header from '../components/Header';
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '../components/ui/ProgressStepper';
import * as api from '../api/client';

interface AvailabilityScreenProps {
  saved: Availability;
  onComplete: (data: Availability) => void;
  onUnauthorized: () => void;
}

const AvailabilityScreen: React.FC<AvailabilityScreenProps> = ({ saved, onComplete, onUnauthorized }) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<Availability>(saved);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const totalSlots = Object.values(availability.slots).flat().length;
  const isValid = totalSlots > 0 && availability.meetingFrequency;

  const handleToggle = (day: string, time: string) => {
    setAvailability(prev => {
      const newSlots = { ...prev.slots };
      if (!newSlots[day]) newSlots[day] = [];
      
      if (newSlots[day].includes(time)) {
        newSlots[day] = newSlots[day].filter(t => t !== time);
        if (newSlots[day].length === 0) delete newSlots[day];
      } else {
        newSlots[day] = [...newSlots[day], time];
      }
      
      return { ...prev, slots: newSlots };
    });
    setTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await api.updateAvailability(availability);
      onComplete(availability);
      navigate('/assignment');
    } catch (err) {
      if (err instanceof api.UnauthorizedError) { onUnauthorized(); return; }
      setSaveError(err instanceof Error ? err.message : 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] mx-auto">
        <Header />
        <Stepper value={1} className="mb-6">
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

        <h1 className="text-heading font-bold text-primary-500 mb-6">When can you work?</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="input-label">Select your available time slots</label>
            <p className="text-caption text-text-muted mb-3">Tap to toggle</p>
            <AvailabilityGrid selectedSlots={availability.slots} onToggle={handleToggle} />
            {touched && totalSlots === 0 && (
              <p className="input-error mt-2">Please select at least one time slot</p>
            )}
          </div>

          <div className="mb-6">
            <ChipSelector label="Meeting frequency"
              options={['Once a week', '2-3 times a week', 'Flexible']}
              selected={availability.meetingFrequency ? [availability.meetingFrequency] : []}
              onChange={s => { setAvailability(p => ({ ...p, meetingFrequency: (s[0] || '') as Availability['meetingFrequency'] })); setTouched(true); }}
              mode="single" />
          </div>

          {saveError && <p className="input-error mb-3">{saveError}</p>}
          <PrimaryButton label={saving ? 'Saving…' : 'Save availability'} type="submit" disabled={!isValid || saving} />
        </form>
      </div>
    </div>
  );
};

export default AvailabilityScreen;
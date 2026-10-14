// ProfileScreen for TeamMatch
// Step 1: Set up user profile with name, course, skills, preferences

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../types';
import { allSkills } from '../data/mockStudents';
import PrimaryButton from '../components/ui/PrimaryButton';
import InputField from '../components/ui/InputField';
import ChipSelector from '../components/ui/ChipSelector';
import Header from '../components/Header';
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '../components/ui/ProgressStepper';
import * as api from '../api/client';

interface ProfileScreenProps {
  saved: Profile;
  onComplete: (data: Profile) => void;
  onUnauthorized: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ saved, onComplete, onUnauthorized }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(saved);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors: Record<string, string> = {};
  if (touched.name && !profile.name) errors.name = 'Name is required';
  if (touched.name && profile.name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (touched.course && !profile.course) errors.course = 'Course is required';
  if (touched.course && profile.course.length < 2) errors.course = 'Course must be at least 2 characters';

  const isValid = profile.name.length >= 2 && profile.course.length >= 2 && 
    profile.skills.length > 0 && profile.studyPreference && profile.commitment;

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await api.updateProfile(profile);
      onComplete(profile);
      navigate('/availability');
    } catch (err) {
      if (err instanceof api.UnauthorizedError) { onUnauthorized(); return; }
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] mx-auto">
        <Header />
        {/* Progress stepper */}
        <Stepper value={0} className="mb-6">
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

        <h1 className="text-heading font-bold text-primary-500 mb-6">Set up your profile</h1>

        <form onSubmit={handleSubmit}>
          <InputField label="Your name" name="name" value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            onBlur={() => handleBlur('name')} placeholder="Enter your name"
            error={errors.name} required className="mb-4" />

          <InputField label="Course name" name="course" value={profile.course}
            onChange={(e) => setProfile(prev => ({ ...prev, course: e.target.value }))}
            onBlur={() => handleBlur('course')} placeholder="e.g., Business Analytics"
            error={errors.course} required className="mb-4" />

          <div className="mb-4">
            <ChipSelector label="Your skills" options={allSkills} selected={profile.skills}
              onChange={s => setProfile(p => ({ ...p, skills: s }))} mode="multi" />
          </div>

          <div className="mb-4">
            <ChipSelector label="Study preference" options={['Online', 'In-person', 'Either']}
              selected={profile.studyPreference ? [profile.studyPreference] : []}
              onChange={s => { setProfile(p => ({ ...p, studyPreference: (s[0] || '') as Profile['studyPreference'] })); setTouched(p => ({ ...p, studyPreference: true })); }}
              mode="single" />
          </div>

          <div className="mb-6">
            <ChipSelector label="Commitment" options={['Casual', 'Moderate', 'Highly committed']}
              selected={profile.commitment ? [profile.commitment] : []}
              onChange={s => { setProfile(p => ({ ...p, commitment: (s[0] || '') as Profile['commitment'] })); setTouched(p => ({ ...p, commitment: true })); }}
              mode="single" />
          </div>

          {saveError && <p className="input-error mb-3">{saveError}</p>}
          <PrimaryButton label={saving ? 'Saving…' : 'Continue'} type="submit" disabled={!isValid || saving} />
        </form>
      </div>
    </div>
  );
};

export default ProfileScreen;
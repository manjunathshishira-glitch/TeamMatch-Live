// AssignmentScreen for TeamMatch
// Step 3: Create assignment details and team requirements

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Assignment } from '../types';
import { allSkills } from '../data/mockStudents';
import PrimaryButton from '../components/ui/PrimaryButton';
import InputField from '../components/ui/InputField';
import ChipSelector from '../components/ui/ChipSelector';
import Header from '../components/Header';
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '../components/ui/ProgressStepper';
import * as api from '../api/client';

interface Props {
  saved: Assignment;
  onComplete: (data: Assignment) => void;
  onAssignmentCreated: (id: number) => void;
  onUnauthorized: () => void;
}

const AssignmentScreen: React.FC<Props> = ({ saved, onComplete, onAssignmentCreated, onUnauthorized }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Assignment>(saved);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors: Record<string, string> = {};
  if (touched.unitCode && !form.unitCode) errors.unitCode = 'Unit code is required';
  if (touched.projectName && !form.projectName) errors.projectName = 'Project name is required';
  if (touched.dueDate && !form.dueDate) errors.dueDate = 'Due date is required';
  if (touched.dueDate && form.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(form.dueDate) < today) {
      errors.dueDate = "Due date can't be in the past";
    }
  }

  const isValid = form.unitCode && form.projectName && form.groupSize >= 2 && 
    form.dueDate && !errors.dueDate && form.requiredSkills.length > 0 && form.meetingPreference && form.minimumCommitment;

  const blur = (f: string) => setTouched(p => ({ ...p, [f]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const result = await api.createAssignment(form);
      onAssignmentCreated(result.id);
      onComplete(form);
      navigate('/matches');
    } catch (err) {
      if (err instanceof api.UnauthorizedError) { onUnauthorized(); return; }
      setSaveError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] mx-auto">
        <Header />
        <Stepper value={2} className="mb-6">
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
        <h1 className="text-heading font-bold text-primary-500 mb-6">Create an assignment</h1>
        <form onSubmit={submit}>
          <InputField label="Unit code" name="unitCode" value={form.unitCode}
            onChange={e => setForm(p => ({ ...p, unitCode: e.target.value }))}
            onBlur={() => blur('unitCode')} placeholder="e.g., BUS4012"
            error={errors.unitCode} required className="mb-4" />

          <InputField label="Project name" name="projectName" value={form.projectName}
            onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))}
            onBlur={() => blur('projectName')} placeholder="e.g., Business Analytics Consulting"
            error={errors.projectName} required className="mb-4" />
          <div className="mb-4">
            <label htmlFor="groupSize" className="input-label">Group size</label>
            <select id="groupSize" value={form.groupSize}
              onChange={e => setForm(p => ({ ...p, groupSize: parseInt(e.target.value) }))}
              className="input-field">
              {[2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s} members</option>)}
            </select>
          </div>
          <InputField label="Due date" name="dueDate" type="date" value={form.dueDate}
            onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            onBlur={() => blur('dueDate')} error={errors.dueDate} required className="mb-4" />
          <div className="mb-4">
            <ChipSelector label="Required skills" options={allSkills} selected={form.requiredSkills}
              onChange={s => setForm(p => ({ ...p, requiredSkills: s }))} mode="multi" />
          </div>
          <div className="mb-4">
            <ChipSelector label="Meeting preference" options={['Online', 'In person', 'Both']}
              selected={form.meetingPreference ? [form.meetingPreference] : []}
              onChange={s => { setForm(p => ({ ...p, meetingPreference: (s[0] || '') as Assignment['meetingPreference'] })); setTouched(p => ({ ...p, meetingPreference: true })); }}
              mode="single" />
          </div>
          <div className="mb-6">
            <ChipSelector label="Minimum commitment" options={['Low', 'Moderate', 'High']}
              selected={form.minimumCommitment ? [form.minimumCommitment] : []}
              onChange={s => { setForm(p => ({ ...p, minimumCommitment: (s[0] || '') as Assignment['minimumCommitment'] })); setTouched(p => ({ ...p, minimumCommitment: true })); }}
              mode="single" />
          </div>
          {saveError && <p className="input-error mb-3">{saveError}</p>}
          <PrimaryButton label={saving ? 'Saving…' : 'Find teammates'} type="submit" disabled={!isValid || saving} />
        </form>
      </div>
    </div>
  );
};

export default AssignmentScreen;
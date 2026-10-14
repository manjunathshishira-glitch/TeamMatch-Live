// TeamMatch App - Central State Hub
// 
// HOW DATA FLOWS:
// 1. All form data (profile, availability, assignment, groupMembers) lives here in App state
// 2. Each page receives saved data as props (Props Down)
// 3. Each page calls onComplete(data) to save data back (Callbacks Up)
// 4. Router state is used only for the ResultScreen (navigate with { state: { success, reason } })
// 5. NO localStorage - all data is in React state only

import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import type { Profile, Availability, Assignment, GroupMember } from './types';
import { useAuth } from './contexts/AuthContext';
import * as api from './api/client';
import type { MeResponse } from './api/client';
import LoginScreen from './pages/LoginScreen';
import ProfileScreen from './pages/ProfileScreen';
import AvailabilityScreen from './pages/AvailabilityScreen';
import AssignmentScreen from './pages/AssignmentScreen';
import MatchesScreen from './pages/MatchesScreen';
import ResultScreen from './pages/ResultScreen';

const youMember: GroupMember = { id: 'you', name: 'You', avatarInitials: 'You' };

function toGroupMember(m: MeResponse['groupMembers'][number]): GroupMember {
  const parts = m.memberName.split(' ').filter(Boolean);
  const avatarInitials = (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : m.memberName.slice(0, 2)
  ).toUpperCase();
  return { id: m.memberId, name: m.memberName, avatarInitials };
}

function App() {
  const { token, login, logout } = useAuth();
  const navigate = useNavigate();

  // Central state for all form data
  const [profile, setProfile] = useState<Profile>({
    name: '', course: '', skills: [], studyPreference: '', commitment: '',
  });
  const [availability, setAvailability] = useState<Availability>({
    slots: {}, meetingFrequency: '',
  });
  const [assignment, setAssignment] = useState<Assignment>({
    unitCode: '', projectName: '', groupSize: 4, dueDate: '',
    requiredSkills: [], meetingPreference: '', minimumCommitment: '',
  });
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([youMember]);

  // Prevent double-fetch: handleLogin marks the token it already loaded for
  const dataLoadedFor = useRef<string | null>(null);

  const handleUnauthorized = useCallback(() => { logout(); }, [logout]);

  // Called by LoginScreen after successful auth — sets token, fetches data, navigates
  const handleLogin = useCallback(async (accessToken: string) => {
    login(accessToken);                       // sets sessionStorage + React state
    setProfile({ name: '', course: '', skills: [], studyPreference: '', commitment: '' });
    setAvailability({ slots: {}, meetingFrequency: '' });
    setAssignment({ unitCode: '', projectName: '', groupSize: 4, dueDate: '', requiredSkills: [], meetingPreference: '', minimumCommitment: '' });
    setAssignmentId(null);
    setGroupMembers([youMember]);

    try {
      const me = await api.getMe();
      dataLoadedFor.current = accessToken;
      if (me.profile) setProfile({ name: me.profile.name ?? '', course: me.profile.course ?? '', skills: me.profile.skills ?? [], studyPreference: (me.profile.studyPreference || '') as Profile['studyPreference'], commitment: (me.profile.commitment || '') as Profile['commitment'] });
      if (me.availability) setAvailability({ slots: me.availability.slots ?? {}, meetingFrequency: (me.availability.meetingFrequency || '') as Availability['meetingFrequency'] });
      if (me.latestAssignment) { const a = me.latestAssignment; setAssignment({ unitCode: a.unitCode ?? '', projectName: a.projectName ?? '', groupSize: a.groupSize ?? 4, dueDate: a.dueDate ?? '', requiredSkills: a.requiredSkills ?? [], meetingPreference: (a.meetingPreference || '') as Assignment['meetingPreference'], minimumCommitment: (a.minimumCommitment || '') as Assignment['minimumCommitment'] }); setAssignmentId(a.id); }
      if (me.groupMembers.length > 0) setGroupMembers([youMember, ...me.groupMembers.map(toGroupMember)]);
    } catch (err) {
      if (err instanceof api.UnauthorizedError) { handleUnauthorized(); return; }
      console.error('Failed to load saved data:', err);
    }
    navigate('/profile');
  }, [login, navigate, handleUnauthorized]);

  // Page-refresh: fetch saved data when token already exists in sessionStorage
  useEffect(() => {
    if (!token || dataLoadedFor.current === token) return;
    let cancelled = false;
    api.getMe().then(me => {
      if (cancelled) return;
      dataLoadedFor.current = token;
      if (me.profile) setProfile({ name: me.profile.name ?? '', course: me.profile.course ?? '', skills: me.profile.skills ?? [], studyPreference: (me.profile.studyPreference || '') as Profile['studyPreference'], commitment: (me.profile.commitment || '') as Profile['commitment'] });
      if (me.availability) setAvailability({ slots: me.availability.slots ?? {}, meetingFrequency: (me.availability.meetingFrequency || '') as Availability['meetingFrequency'] });
      if (me.latestAssignment) { const a = me.latestAssignment; setAssignment({ unitCode: a.unitCode ?? '', projectName: a.projectName ?? '', groupSize: a.groupSize ?? 4, dueDate: a.dueDate ?? '', requiredSkills: a.requiredSkills ?? [], meetingPreference: (a.meetingPreference || '') as Assignment['meetingPreference'], minimumCommitment: (a.minimumCommitment || '') as Assignment['minimumCommitment'] }); setAssignmentId(a.id); }
      if (me.groupMembers.length > 0) setGroupMembers([youMember, ...me.groupMembers.map(toGroupMember)]);
    }).catch(err => { if (!cancelled && !(err instanceof api.UnauthorizedError)) console.error(err); if (!cancelled && err instanceof api.UnauthorizedError) logout(); });
    return () => { cancelled = true; };
  }, [token, logout]);

  const handleInvite = (member: GroupMember) => {
    setGroupMembers(prev => [...prev, member]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<LoginScreen onLogin={handleLogin} />} />
        <Route path="/profile" element={<ProfileScreen saved={profile} onComplete={setProfile} onUnauthorized={handleUnauthorized} />} />
        <Route path="/availability" element={<AvailabilityScreen saved={availability} onComplete={setAvailability} onUnauthorized={handleUnauthorized} />} />
        <Route path="/assignment" element={<AssignmentScreen saved={assignment} onComplete={setAssignment} onAssignmentCreated={setAssignmentId} onUnauthorized={handleUnauthorized} />} />
        <Route path="/matches" element={<MatchesScreen availability={availability} assignment={assignment} assignmentId={assignmentId} groupMembers={groupMembers} onInvite={handleInvite} onComplete={() => {}} onUnauthorized={handleUnauthorized} />} />
        <Route path="/result" element={<ResultScreen groupMembers={groupMembers} assignment={assignment} availability={availability} />} />
      </Routes>
    </div>
  );
}

export default App;

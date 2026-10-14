// Mock student data for TeamMatch MVP
// These students represent potential teammates shown on the MatchesScreen

import type { MockStudent } from '../types';

export const mockStudents: MockStudent[] = [
  {
    id: 'sarah',
    name: 'Sarah M.',
    course: 'Business Analytics',
    skills: ['Data Analysis', 'Excel', 'Presentation'],
    availability: {
      Mon: ['Evening'],
      Wed: ['Evening'],
      Fri: ['Afternoon', 'Evening'],
    },
    studyPreference: 'Online',
    commitment: 'Highly committed',
    meetingFrequency: 'Once a week',
    avatarInitials: 'SM',
    reasonTag: 'Early planner',
  },
  {
    id: 'ahmed',
    name: 'Ahmed K.',
    course: 'Computer Science',
    skills: ['Excel', 'Data Analysis'],
    availability: {
      Wed: ['Morning', 'Afternoon', 'Evening'],
      Sat: ['Morning', 'Afternoon', 'Evening'],
    },
    studyPreference: 'Online',
    commitment: 'Moderate',
    meetingFrequency: 'Flexible',
    avatarInitials: 'AK',
    reasonTag: 'Flexible schedule',
  },
  {
    id: 'jessica',
    name: 'Jessica T.',
    course: 'Marketing',
    skills: ['Presentation', 'Research'],
    availability: {
      Sat: ['Morning', 'Afternoon'],
    },
    studyPreference: 'In-person',
    commitment: 'Casual',
    meetingFrequency: '2-3 times a week',
    avatarInitials: 'JT',
    reasonTag: 'Research focused',
  },
];

// Alex is already in the user's group
export const alexMember = {
  id: 'alex',
  name: 'Alex',
  avatarInitials: 'A',
};

// All skill options available in the app
export const allSkills = [
  'Data Analysis',
  'Excel',
  'Python',
  'Research',
  'Presentation',
  'Design',
  'SQL',
];

// Days of the week for availability grid
export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Time slots for availability grid
export const timeSlots = ['Morning', 'Afternoon', 'Evening'];
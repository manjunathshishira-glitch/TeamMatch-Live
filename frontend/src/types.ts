// TeamMatch TypeScript interfaces
// These define the shape of data flowing through the app

export interface Profile {
  name: string;
  course: string;
  skills: string[];
  studyPreference: 'Online' | 'In-person' | 'Either' | '';
  commitment: 'Casual' | 'Moderate' | 'Highly committed' | '';
}

export interface Availability {
  slots: Record<string, string[]>;
  meetingFrequency: 'Once a week' | '2-3 times a week' | 'Flexible' | '';
}

export interface Assignment {
  unitCode: string;
  projectName: string;
  groupSize: number;
  dueDate: string;
  requiredSkills: string[];
  meetingPreference: 'Online' | 'In person' | 'Both' | '';
  minimumCommitment: 'Low' | 'Moderate' | 'High' | '';
}

export interface MockStudent {
  id: string;
  name: string;
  course: string;
  skills: string[];
  availability: Record<string, string[]>;
  studyPreference: string;
  commitment: string;
  meetingFrequency: string;
  avatarInitials: string;
  reasonTag: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatarInitials: string;
}

export interface MatchResult {
  student: MockStudent;
  score: number;
  reason: string;
}
// Compatibility score calculation for TeamMatch
// This algorithm is transparent and explainable to users

import type { MockStudent, Availability, Assignment, MatchResult } from '../types';

/**
 * Calculate compatibility score between user and a potential teammate
 * 
 * Components:
 * - Skill coverage (50%): How many required skills does the student have?
 * - Availability overlap (30%): How many time slots do they share?
 * - Study preference match (20%): Do their study preferences align?
 */
export function calculateMatchScore(
  student: MockStudent,
  userAvailability: Availability,
  assignment: Assignment
): MatchResult {
  // 1. Skill coverage score (0 to 1)
  const requiredSkills = assignment.requiredSkills;
  const matchedSkills = requiredSkills.filter(skill => 
    student.skills.includes(skill)
  );
  const skillScore = requiredSkills.length > 0 
    ? matchedSkills.length / requiredSkills.length 
    : 0;

  // 2. Availability overlap score (0 to 1)
  const userSlots = userAvailability.slots;
  let overlapCount = 0;
  let totalUserSlots = 0;

  Object.entries(userSlots).forEach(([day, times]) => {
    times.forEach(time => {
      totalUserSlots++;
      if (student.availability[day]?.includes(time)) {
        overlapCount++;
      }
    });
  });

  const availScore = totalUserSlots > 0 ? overlapCount / totalUserSlots : 0;

  // 3. Study preference match score (0 to 1)
  let prefScore = 0;
  if (assignment.meetingPreference && student.studyPreference) {
    if (assignment.meetingPreference === 'Both') {
      prefScore = 1; // User is flexible
    } else if (assignment.meetingPreference === student.studyPreference) {
      prefScore = 1; // Exact match
    } else if (student.studyPreference === 'Either') {
      prefScore = 0.5; // Student is flexible
    }
  }

  // Calculate final score (weighted average)
  const finalScore = Math.round(
    (skillScore * 0.5 + availScore * 0.3 + prefScore * 0.2) * 100
  );

  // Build explainable reason
  const reasons: string[] = [];
  
  if (matchedSkills.length > 0) {
    reasons.push(`Shares ${matchedSkills.length} of your required skills`);
  }
  
  if (overlapCount > 0) {
    const overlappingDays = Object.entries(userSlots)
      .filter(([day, times]) => 
        times.some(time => student.availability[day]?.includes(time))
      )
      .map(([day]) => day);
    
    if (overlappingDays.length > 0) {
      reasons.push(`${overlappingDays.join(' & ')} availability overlap`);
    }
  }

  // Add student's distinguishing trait
  reasons.push(student.reasonTag);

  const reason = reasons.join(' - ');

  return {
    student,
    score: finalScore,
    reason,
  };
}

/**
 * Calculate matches for all mock students
 * Returns sorted by score (highest first)
 */
export function calculateAllMatches(
  students: MockStudent[],
  userAvailability: Availability,
  assignment: Assignment
): MatchResult[] {
  return students
    .map(student => calculateMatchScore(student, userAvailability, assignment))
    .sort((a, b) => b.score - a.score);
}
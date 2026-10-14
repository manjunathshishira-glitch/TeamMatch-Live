"""
TeamMatch Data Endpoints

API endpoints for TeamMatch data:
- profiles:      student profile (name, course, skills, preferences)
- availability:  weekly slots and meeting frequency
- assignments:   unit project assignment requirements
- group_members: members of a user's assignment group

SECURITY:
- Every endpoint requires "Authorization: Bearer <token>".
- The token is verified against Supabase Auth and the user id it returns
  is used for every query. A user id sent from the browser is never trusted.
"""

import logging
from datetime import date
from typing import Annotated, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, StringConstraints

import crud
from auth import get_current_user

logger = logging.getLogger("teammatch")

# =====================================================
# ROUTER
# =====================================================
router = APIRouter(prefix="/data", tags=["TeamMatch"])

# =====================================================
# SHARED VALIDATION TYPES
# =====================================================
NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]

# Allowed values match the frontend data types
StudyPreference = Literal["Online", "In-person", "Either"]
Commitment = Literal["Casual", "Moderate", "Highly committed"]
MeetingFrequency = Literal["Once a week", "2-3 times a week", "Flexible"]
MeetingPreference = Literal["Online", "In person", "Both"]
MinimumCommitment = Literal["Low", "Moderate", "High"]


# =====================================================
# REQUEST MODELS
# =====================================================
class ProfileUpdate(BaseModel):
    name: NonEmptyStr
    course: NonEmptyStr
    skills: List[NonEmptyStr] = Field(default_factory=list)
    studyPreference: StudyPreference
    commitment: Commitment


class AvailabilityUpdate(BaseModel):
    slots: Dict[str, List[NonEmptyStr]] = Field(default_factory=dict)
    meetingFrequency: MeetingFrequency


class AssignmentCreate(BaseModel):
    unitCode: NonEmptyStr
    projectName: NonEmptyStr
    groupSize: int = Field(ge=1)
    dueDate: date
    requiredSkills: List[NonEmptyStr] = Field(default_factory=list)
    meetingPreference: MeetingPreference
    minimumCommitment: MinimumCommitment


class GroupMemberCreate(BaseModel):
    memberId: NonEmptyStr
    memberName: NonEmptyStr


class GroupMembersCreate(BaseModel):
    assignmentId: Optional[int] = Field(default=None, ge=1)
    members: List[GroupMemberCreate] = Field(min_length=1)


# =====================================================
# HELPER: verify the Supabase token and get the user
# =====================================================
async def get_verified_user(authorization: str):
    """
    Verify the Authorization header against Supabase Auth.

    Returns the Supabase user (id + email) for the token. Raises 401 if the
    header is missing/invalid or the token is invalid or expired.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    return await get_current_user(authorization)


# =====================================================
# ENDPOINTS
# =====================================================
@router.get("/me")
async def get_my_data(authorization: str = Header(...)):
    """
    Get all TeamMatch data for the authenticated user.

    Returns the profile, availability, latest assignment and the group
    members of that assignment. Missing pieces come back as null / [].
    """
    user = await get_verified_user(authorization)

    try:
        profile = crud.get_profile(user.id)
        availability = crud.get_availability(user.id)
        latest_assignment = crud.get_latest_assignment(user.id)

        group_members = []
        if latest_assignment:
            group_members = crud.get_group_members(user.id, latest_assignment["id"])
    except Exception:
        logger.exception("Failed to load TeamMatch data for user %s", user.id)
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")

    return {
        "profile": profile,
        "availability": availability,
        "latestAssignment": latest_assignment,
        "groupMembers": group_members,
    }


@router.put("/profile")
async def upsert_profile(request: ProfileUpdate, authorization: str = Header(...)):
    """Create or update the authenticated user's profile."""
    user = await get_verified_user(authorization)

    try:
        crud.ensure_profile(user.id, user.email)
        return crud.upsert_profile(
            user_id=user.id,
            email=user.email,
            name=request.name,
            course=request.course,
            skills=request.skills,
            study_preference=request.studyPreference,
            commitment=request.commitment,
        )
    except Exception:
        logger.exception("Failed to save profile for user %s", user.id)
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")


@router.put("/availability")
async def upsert_availability(request: AvailabilityUpdate, authorization: str = Header(...)):
    """Create or update the authenticated user's availability."""
    user = await get_verified_user(authorization)

    try:
        crud.ensure_profile(user.id, user.email)
        return crud.upsert_availability(
            user_id=user.id,
            slots=request.slots,
            meeting_frequency=request.meetingFrequency,
        )
    except Exception:
        logger.exception("Failed to save availability for user %s", user.id)
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")


@router.post("/assignments")
async def create_assignment(request: AssignmentCreate, authorization: str = Header(...)):
    """Create a new assignment for the authenticated user."""
    user = await get_verified_user(authorization)

    try:
        crud.ensure_profile(user.id, user.email)
        return crud.create_assignment(
            user_id=user.id,
            unit_code=request.unitCode,
            project_name=request.projectName,
            group_size=request.groupSize,
            due_date=request.dueDate,
            required_skills=request.requiredSkills,
            meeting_preference=request.meetingPreference,
            minimum_commitment=request.minimumCommitment,
        )
    except Exception:
        logger.exception("Failed to create assignment for user %s", user.id)
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")


@router.post("/group-members")
async def create_group_members(request: GroupMembersCreate, authorization: str = Header(...)):
    """
    Add members to one of the authenticated user's assignments.

    If assignmentId is omitted, the members are added to the user's latest
    assignment. A provided assignmentId must belong to the user.
    """
    user = await get_verified_user(authorization)

    try:
        crud.ensure_profile(user.id, user.email)

        if request.assignmentId is not None:
            assignment = crud.get_assignment_if_owned(user.id, request.assignmentId)
            if not assignment:
                raise HTTPException(status_code=404, detail="Assignment not found")
        else:
            assignment = crud.get_latest_assignment(user.id)
            if not assignment:
                raise HTTPException(
                    status_code=404,
                    detail="No assignment found for this user. Create an assignment first."
                )

        members = crud.create_group_members(
            user_id=user.id,
            assignment_id=assignment["id"],
            members=[
                {"memberId": member.memberId, "memberName": member.memberName}
                for member in request.members
            ],
        )
        return {"assignmentId": assignment["id"], "groupMembers": members}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to add group members for user %s", user.id)
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")

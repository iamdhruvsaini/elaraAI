"""
GlamAI - Events & Scheduling Endpoints
Calendar integration and event management
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.makeup import ScheduledEvent, MakeupSession, SessionStatus
from app.schemas.makeup import EventCreate, EventUpdate, EventResponse
from app.api.deps.auth import get_current_user
from app.services.azure.storage_service import storage_service
from typing import List
from datetime import datetime, timedelta
from loguru import logger

router = APIRouter()


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new scheduled event"""
    new_event = ScheduledEvent(
        user_id=current_user.id,
        event_name=event_data.event_name,
        event_date=event_data.event_date,
        event_time=event_data.event_time,
        occasion=event_data.occasion,
        outfit_description=event_data.outfit_description,
        remind_1_day_before=event_data.remind_1_day_before,
        remind_2_hours_before=event_data.remind_2_hours_before
    )
    
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    logger.info(f"Event created: {new_event.id} for user {current_user.id}")
    return new_event


@router.post("/{event_id}/upload-outfit")
async def upload_event_outfit(
    event_id: int,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload outfit image for scheduled event"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    image_bytes = await image.read()
    image_url = await storage_service.upload_outfit_image(
        image_bytes,
        current_user.id,
        content_type=image.content_type
    )
    
    event.outfit_image_url = image_url
    await db.commit()
    
    return {"message": "Outfit image uploaded", "image_url": image_url}


@router.get("", response_model=List[EventResponse])
async def get_all_events(
    include_past: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all user's events"""
    query = select(ScheduledEvent).where(
        ScheduledEvent.user_id == current_user.id,
        ScheduledEvent.is_active == True
    )
    
    if not include_past:
        query = query.where(ScheduledEvent.event_date >= datetime.utcnow())
    
    query = query.order_by(ScheduledEvent.event_date)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/upcoming", response_model=List[EventResponse])
async def get_upcoming_events(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming events within specified days"""
    end_date = datetime.utcnow() + timedelta(days=days)
    
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.user_id == current_user.id,
            ScheduledEvent.is_active == True,
            ScheduledEvent.event_date >= datetime.utcnow(),
            ScheduledEvent.event_date <= end_date
        ).order_by(ScheduledEvent.event_date)
    )
    
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific event details"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update event details"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel/delete an event"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    event.is_active = False
    event.is_cancelled = True
    await db.commit()
    
    return {"message": "Event cancelled"}


@router.post("/{event_id}/start-session")
async def start_session_for_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a makeup session for this scheduled event"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    if event.makeup_session_id:
        return {
            "message": "Session already exists for this event",
            "session_id": event.makeup_session_id
        }
    
    new_session = MakeupSession(
        user_id=current_user.id,
        occasion=event.occasion,
        scope="full_face",
        status=SessionStatus.IN_PROGRESS,
        outfit_description=event.outfit_description,
        outfit_image_url=event.outfit_image_url
    )
    
    db.add(new_session)
    await db.flush()
    
    event.makeup_session_id = new_session.id
    await db.commit()
    await db.refresh(new_session)
    
    return {
        "message": "Makeup session started for event",
        "session_id": new_session.id,
        "event_id": event.id
    }


@router.get("/{event_id}/reminders")
async def get_event_reminders(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get reminder status for event"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    one_day_before = event.event_date - timedelta(days=1)
    two_hours_before = event.event_date - timedelta(hours=2)
    
    return {
        "event_id": event.id,
        "event_date": event.event_date,
        "reminders": {
            "skincare_prep": {
                "enabled": event.remind_1_day_before,
                "scheduled_for": one_day_before,
                "sent": event.skincare_reminder_sent,
                "message": "Start your skincare routine tonight!"
            },
            "makeup_start": {
                "enabled": event.remind_2_hours_before,
                "scheduled_for": two_hours_before,
                "sent": event.makeup_reminder_sent,
                "message": f"Time to get ready for {event.event_name}!"
            }
        }
    }


@router.post("/{event_id}/complete")
async def mark_event_complete(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark event as completed"""
    result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.id == event_id,
            ScheduledEvent.user_id == current_user.id
        )
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    event.session_completed = True
    await db.commit()
    return {"message": "Event marked as completed"}


@router.get("/stats/summary")
async def get_events_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get events statistics summary"""
    upcoming_result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.user_id == current_user.id,
            ScheduledEvent.is_active == True,
            ScheduledEvent.event_date >= datetime.utcnow()
        )
    )
    upcoming = upcoming_result.scalars().all()
    
    past_result = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.user_id == current_user.id,
            ScheduledEvent.event_date < datetime.utcnow()
        )
    )
    past = past_result.scalars().all()
    
    completed = sum(1 for e in past if e.session_completed)
    next_event = min(upcoming, key=lambda e: e.event_date) if upcoming else None
    
    return {
        "total_upcoming": len(upcoming),
        "total_past": len(past),
        "completed_sessions": completed,
        "next_event": {
            "id": next_event.id,
            "name": next_event.event_name,
            "date": next_event.event_date,
            "days_until": (next_event.event_date - datetime.utcnow()).days
        } if next_event else None
    }
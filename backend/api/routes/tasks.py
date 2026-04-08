from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...db.supabase import get_db
from ...api.middleware import get_user_or_dev
from ...db.models import TaskCreate, TaskUpdate, Task

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/tasks", response_model=list[Task])
@limiter.limit("60/minute")
async def get_tasks(
    request: Request,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import task_tools

        return await task_tools.list_tasks(
            db, user["user_id"], status=status, priority=priority, tag=tag, limit=limit
        )
    except Exception as e:
        logger.warning(f"DB unavailable for tasks: {e}")
        return []


@router.post("/tasks", response_model=Task, status_code=201)
@limiter.limit("30/minute")
async def create_task(
    request: Request,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import task_tools

        return await task_tools.create_task(
            db,
            user_id=user["user_id"],
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_date=data.due_date,
            tags=data.tags,
        )
    except Exception as e:
        logger.warning(f"DB unavailable for create_task: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.patch("/tasks/{task_id}", response_model=Task)
@limiter.limit("30/minute")
async def update_task(
    request: Request,
    task_id: str,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import task_tools

        updates = data.model_dump(exclude_unset=True)
        result = await task_tools.update_task(db, user["user_id"], task_id, **updates)
        if result is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB unavailable for update_task: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.delete("/tasks/{task_id}", status_code=204)
@limiter.limit("30/minute")
async def delete_task(
    request: Request,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import task_tools

        deleted = await task_tools.delete_task(db, user["user_id"], task_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB unavailable for delete_task: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

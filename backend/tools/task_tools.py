from sqlalchemy import select, update as sa_update, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import uuid

from ..db.supabase import TaskModel
from ..db.models import Task


async def create_task(
    db: AsyncSession,
    user_id: str,
    title: str,
    priority: str = "medium",
    due_date: datetime = None,
    tags: list[str] = None,
    description: str = "",
) -> dict:
    task_id = uuid.uuid4()
    task = TaskModel(
        id=task_id,
        user_id=uuid.UUID(user_id),
        title=title,
        description=description,
        priority=priority,
        status="todo",
        tags=tags or [],
        due_date=due_date,
        agent_created=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {
        "id": str(task.id),
        "user_id": str(task.user_id),
        "title": task.title,
        "priority": task.priority,
        "status": task.status,
        "tags": task.tags,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "agent_created": task.agent_created,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


async def list_tasks(
    db: AsyncSession,
    user_id: str,
    status: str = None,
    priority: str = None,
    tag: str = None,
    limit: int = 50,
) -> list[dict]:
    query = select(TaskModel).where(TaskModel.user_id == uuid.UUID(user_id))
    if status:
        query = query.where(TaskModel.status == status)
    if priority:
        query = query.where(TaskModel.priority == priority)
    if tag:
        query = query.where(TaskModel.tags.contains([tag]))
    query = query.order_by(TaskModel.created_at.desc()).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [_task_to_dict(t) for t in tasks]


async def update_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
    **updates,
) -> dict | None:
    updates["updated_at"] = datetime.now(timezone.utc)
    stmt = (
        sa_update(TaskModel)
        .where(
            TaskModel.id == uuid.UUID(task_id), TaskModel.user_id == uuid.UUID(user_id)
        )
        .values(**{k: v for k, v in updates.items() if v is not None})
        .returning(TaskModel)
    )
    result = await db.execute(stmt)
    await db.commit()
    task = result.scalar_one_or_none()
    if task is None:
        return None
    return _task_to_dict(task)


async def delete_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
) -> bool:
    stmt = sa_delete(TaskModel).where(
        TaskModel.id == uuid.UUID(task_id), TaskModel.user_id == uuid.UUID(user_id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


def _task_to_dict(task: TaskModel) -> dict:
    return {
        "id": str(task.id),
        "user_id": str(task.user_id),
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "tags": task.tags or [],
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "agent_created": task.agent_created,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete as sa_delete
from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.supabase import TaskModel


_USE_DB_BACKEND = True
_DB_TIMEOUT_SECONDS = 15
_FALLBACK_TASKS: dict[str, list[dict]] = {}


def _fallback_task_bucket(user_id: str) -> list[dict]:
    return _FALLBACK_TASKS.setdefault(user_id, [])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def _create_fallback_task(
    user_id: str,
    title: str,
    priority: str = "medium",
    due_date: datetime | None = None,
    tags: list[str] | None = None,
    description: str = "",
) -> dict:
    now = _now_iso()
    task = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "description": description,
        "priority": priority,
        "status": "todo",
        "tags": tags or [],
        "due_date": due_date.isoformat() if due_date else None,
        "agent_created": True,
        "created_at": now,
        "updated_at": now,
    }
    _fallback_task_bucket(user_id).append(task)
    return task


def _filter_fallback_tasks(
    user_id: str,
    status: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    limit: int = 50,
) -> list[dict]:
    tasks = _fallback_task_bucket(user_id)
    filtered = tasks
    if status:
        filtered = [t for t in filtered if t.get("status") == status]
    if priority:
        filtered = [t for t in filtered if t.get("priority") == priority]
    if tag:
        filtered = [t for t in filtered if tag in (t.get("tags") or [])]
    return list(reversed(filtered))[:limit]


def _update_fallback_task(user_id: str, task_id: str, **updates) -> dict | None:
    for task in _fallback_task_bucket(user_id):
        if task["id"] == task_id:
            for key, value in updates.items():
                if value is not None:
                    task[key] = value
            task["updated_at"] = _now_iso()
            return task
    return None


def _delete_fallback_task(user_id: str, task_id: str) -> bool:
    bucket = _fallback_task_bucket(user_id)
    before = len(bucket)
    bucket[:] = [task for task in bucket if task["id"] != task_id]
    return len(bucket) < before


def _parse_uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


async def create_task(
    db: AsyncSession,
    user_id: str,
    title: str,
    priority: str = "medium",
    due_date: datetime = None,
    tags: list[str] = None,
    description: str = "",
) -> dict:
    if not _USE_DB_BACKEND:
        return _create_fallback_task(user_id, title, priority, due_date, tags, description)

    async def _db_create() -> dict:
        task = TaskModel(
            id=uuid.uuid4(),
            user_id=_parse_uuid(user_id),
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
        return _task_to_dict(task)

    try:
        return await asyncio.wait_for(_db_create(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _create_fallback_task(user_id, title, priority, due_date, tags, description)


async def list_tasks(
    db: AsyncSession,
    user_id: str,
    status: str = None,
    priority: str = None,
    tag: str = None,
    limit: int = 50,
) -> list[dict]:
    fallback_tasks = _filter_fallback_tasks(user_id, status, priority, tag, limit)

    if not _USE_DB_BACKEND:
        return fallback_tasks

    async def _db_list() -> list[dict]:
        query = select(TaskModel).where(TaskModel.user_id == _parse_uuid(user_id))
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

    try:
        db_tasks = await asyncio.wait_for(_db_list(), timeout=_DB_TIMEOUT_SECONDS)
        merged = {task["id"]: task for task in db_tasks}
        for task in fallback_tasks:
            merged.setdefault(task["id"], task)
        ordered = sorted(
            merged.values(),
            key=lambda t: t.get("updated_at") or t.get("created_at") or "",
            reverse=True,
        )
        return ordered[:limit]
    except Exception:
        return fallback_tasks


async def update_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
    **updates,
) -> dict | None:
    if not _USE_DB_BACKEND:
        return _update_fallback_task(user_id, task_id, **updates)

    async def _db_update() -> dict | None:
        updates["updated_at"] = datetime.now(timezone.utc)
        stmt = (
            sa_update(TaskModel)
            .where(TaskModel.id == _parse_uuid(task_id), TaskModel.user_id == _parse_uuid(user_id))
            .values(**{k: v for k, v in updates.items() if v is not None})
            .returning(TaskModel)
        )
        result = await db.execute(stmt)
        await db.commit()
        task = result.scalar_one_or_none()
        if task is None:
            return None
        return _task_to_dict(task)

    try:
        return await asyncio.wait_for(_db_update(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _update_fallback_task(user_id, task_id, **updates)


async def delete_task(
    db: AsyncSession,
    user_id: str,
    task_id: str,
) -> bool:
    if not _USE_DB_BACKEND:
        return _delete_fallback_task(user_id, task_id)

    async def _db_delete() -> bool:
        stmt = sa_delete(TaskModel).where(
            TaskModel.id == _parse_uuid(task_id), TaskModel.user_id == _parse_uuid(user_id)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0

    try:
        return await asyncio.wait_for(_db_delete(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _delete_fallback_task(user_id, task_id)
import pytest
from datetime import datetime, timezone
import uuid

from backend.tools import task_tools


@pytest.mark.asyncio
async def test_create_and_list_task(db_session):
    user_id = str(uuid.uuid4())
    result = await task_tools.create_task(
        db_session, user_id, "Test task", priority="high", tags=["test"]
    )
    assert result["title"] == "Test task"
    assert result["priority"] == "high"

    tasks = await task_tools.list_tasks(db_session, user_id)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Test task"


@pytest.mark.asyncio
async def test_update_task(db_session):
    user_id = str(uuid.uuid4())
    created = await task_tools.create_task(db_session, user_id, "Update test")
    task_id = created["id"]

    updated = await task_tools.update_task(db_session, user_id, task_id, status="done")
    assert updated is not None
    assert updated["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(db_session):
    user_id = str(uuid.uuid4())
    created = await task_tools.create_task(db_session, user_id, "Delete test")
    task_id = created["id"]

    deleted = await task_tools.delete_task(db_session, user_id, task_id)
    assert deleted is True

    tasks = await task_tools.list_tasks(db_session, user_id)
    assert len(tasks) == 0


@pytest.mark.asyncio
async def test_filter_tasks(db_session):
    user_id = str(uuid.uuid4())
    await task_tools.create_task(db_session, user_id, "High priority", priority="high")
    await task_tools.create_task(db_session, user_id, "Low priority", priority="low")

    high = await task_tools.list_tasks(db_session, user_id, priority="high")
    assert len(high) == 1
    assert high[0]["priority"] == "high"

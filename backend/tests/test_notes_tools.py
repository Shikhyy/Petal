import pytest
import uuid

from backend.tools import notes_tools


@pytest.mark.asyncio
async def test_create_and_list_note(db_session):
    user_id = str(uuid.uuid4())
    result = await notes_tools.save_note(
        db_session, user_id, "Test note", "Body content", ["test"]
    )
    assert result["title"] == "Test note"
    assert result["body"] == "Body content"

    notes = await notes_tools.list_notes(db_session, user_id)
    assert len(notes) == 1


@pytest.mark.asyncio
async def test_delete_note(db_session):
    user_id = str(uuid.uuid4())
    created = await notes_tools.save_note(db_session, user_id, "Delete me")
    note_id = created["id"]

    deleted = await notes_tools.delete_note(db_session, user_id, note_id)
    assert deleted is True

    notes = await notes_tools.list_notes(db_session, user_id)
    assert len(notes) == 0

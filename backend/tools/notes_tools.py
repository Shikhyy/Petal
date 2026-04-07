from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import uuid

from ..db.supabase import NoteModel


async def save_note(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str = "",
    tags: list[str] = None,
    embedding: list[float] = None,
) -> dict:
    note_id = uuid.uuid4()
    note = NoteModel(
        id=note_id,
        user_id=uuid.UUID(user_id),
        title=title,
        body=body,
        tags=tags or [],
        embedding=embedding,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return _note_to_dict(note)


async def list_notes(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
) -> list[dict]:
    query = (
        select(NoteModel)
        .where(NoteModel.user_id == uuid.UUID(user_id))
        .order_by(NoteModel.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    notes = result.scalars().all()
    return [_note_to_dict(n) for n in notes]


async def search_notes(
    db: AsyncSession,
    user_id: str,
    query_embedding: list[float],
    limit: int = 10,
) -> list[dict]:
    embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"
    sql = text("""
        SELECT id, user_id, title, body, tags, created_at, updated_at,
               1 - (embedding <=> :embedding) as similarity
        FROM notes
        WHERE user_id = :user_id AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding
        LIMIT :limit
    """)
    result = await db.execute(
        sql,
        {
            "user_id": uuid.UUID(user_id),
            "embedding": embedding_str,
            "limit": limit,
        },
    )
    rows = result.fetchall()
    return [
        {
            "id": str(row.id),
            "user_id": str(row.user_id),
            "title": row.title,
            "body": row.body,
            "tags": row.tags or [],
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
            "similarity": float(row.similarity),
        }
        for row in rows
    ]


async def delete_note(
    db: AsyncSession,
    user_id: str,
    note_id: str,
) -> bool:
    from sqlalchemy import delete as sa_delete

    stmt = sa_delete(NoteModel).where(
        NoteModel.id == uuid.UUID(note_id), NoteModel.user_id == uuid.UUID(user_id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


async def update_note(
    db: AsyncSession,
    user_id: str,
    note_id: str,
    title: str,
    body: str = "",
    tags: list[str] = None,
) -> dict | None:
    from sqlalchemy import select

    query = select(NoteModel).where(
        NoteModel.id == uuid.UUID(note_id),
        NoteModel.user_id == uuid.UUID(user_id),
    )
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        return None

    note.title = title
    note.body = body
    note.tags = tags or note.tags
    note.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(note)
    return _note_to_dict(note)


def _note_to_dict(note: NoteModel) -> dict:
    return {
        "id": str(note.id),
        "user_id": str(note.user_id),
        "title": note.title,
        "body": note.body,
        "tags": note.tags or [],
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat(),
    }

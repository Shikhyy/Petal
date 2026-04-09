import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete as sa_delete
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.supabase import NoteModel


_USE_DB_BACKEND = True
_DB_TIMEOUT_SECONDS = 15
_FALLBACK_NOTES: dict[str, list[dict]] = {}


def _fallback_note_bucket(user_id: str) -> list[dict]:
    return _FALLBACK_NOTES.setdefault(user_id, [])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


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


def _create_fallback_note(
    user_id: str,
    title: str,
    body: str = "",
    tags: list[str] | None = None,
) -> dict:
    now = _now_iso()
    note = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "body": body,
        "tags": tags or [],
        "created_at": now,
        "updated_at": now,
    }
    _fallback_note_bucket(user_id).append(note)
    return note


def _list_fallback_notes(user_id: str, limit: int = 50) -> list[dict]:
    return list(reversed(_fallback_note_bucket(user_id)))[:limit]


def _update_fallback_note(
    user_id: str,
    note_id: str,
    title: str,
    body: str,
    tags: list[str] | None = None,
) -> dict | None:
    for note in _fallback_note_bucket(user_id):
        if note["id"] == note_id:
            note["title"] = title
            note["body"] = body
            if tags is not None:
                note["tags"] = tags
            note["updated_at"] = _now_iso()
            return note
    return None


def _delete_fallback_note(user_id: str, note_id: str) -> bool:
    bucket = _fallback_note_bucket(user_id)
    before = len(bucket)
    bucket[:] = [note for note in bucket if note["id"] != note_id]
    return len(bucket) < before


def _search_fallback_notes(
    user_id: str,
    query_embedding: list[float],
    limit: int = 10,
) -> list[dict]:
    # Fallback search is keyword-like using the embedding payload as plain text.
    needle = " ".join(str(value) for value in query_embedding).lower().strip()
    if not needle:
        return []

    matches = []
    for note in _fallback_note_bucket(user_id):
        haystack = (
            f"{note.get('title', '')} {note.get('body', '')} {' '.join(note.get('tags', []))}"
        ).lower()
        if needle in haystack:
            matches.append({**note, "similarity": 0.0})
    return list(reversed(matches))[:limit]


async def save_note(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str = "",
    tags: list[str] = None,
    embedding: list[float] = None,
) -> dict:
    if not _USE_DB_BACKEND:
        return _create_fallback_note(user_id, title, body, tags)

    async def _db_save() -> dict:
        note = NoteModel(
            id=uuid.uuid4(),
            user_id=_parse_uuid(user_id),
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

    try:
        return await asyncio.wait_for(_db_save(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _create_fallback_note(user_id, title, body, tags)


async def list_notes(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
) -> list[dict]:
    fallback_notes = _list_fallback_notes(user_id, limit)

    if not _USE_DB_BACKEND:
        return fallback_notes

    async def _db_list() -> list[dict]:
        query = (
            select(NoteModel)
            .where(NoteModel.user_id == _parse_uuid(user_id))
            .order_by(NoteModel.updated_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        notes = result.scalars().all()
        return [_note_to_dict(n) for n in notes]

    try:
        db_notes = await asyncio.wait_for(_db_list(), timeout=_DB_TIMEOUT_SECONDS)
        merged = {note["id"]: note for note in db_notes}
        for note in fallback_notes:
            merged.setdefault(note["id"], note)
        ordered = sorted(
            merged.values(),
            key=lambda n: n.get("updated_at") or n.get("created_at") or "",
            reverse=True,
        )
        return ordered[:limit]
    except Exception:
        return fallback_notes


async def search_notes(
    db: AsyncSession,
    user_id: str,
    query_embedding: list[float],
    limit: int = 10,
) -> list[dict]:
    if not _USE_DB_BACKEND:
        return _search_fallback_notes(user_id, query_embedding, limit)

    async def _db_search() -> list[dict]:
        embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"
        sql = text(
            """
            SELECT id, user_id, title, body, tags, created_at, updated_at,
                   1 - (embedding <=> :embedding) as similarity
            FROM notes
            WHERE user_id = :user_id AND embedding IS NOT NULL
            ORDER BY embedding <=> :embedding
            LIMIT :limit
            """
        )
        result = await db.execute(
            sql,
            {
                "user_id": _parse_uuid(user_id),
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

    try:
        return await asyncio.wait_for(_db_search(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _search_fallback_notes(user_id, query_embedding, limit)


async def delete_note(
    db: AsyncSession,
    user_id: str,
    note_id: str,
) -> bool:
    if not _USE_DB_BACKEND:
        return _delete_fallback_note(user_id, note_id)

    async def _db_delete() -> bool:
        stmt = sa_delete(NoteModel).where(
            NoteModel.id == _parse_uuid(note_id), NoteModel.user_id == _parse_uuid(user_id)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0

    try:
        return await asyncio.wait_for(_db_delete(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _delete_fallback_note(user_id, note_id)


async def update_note(
    db: AsyncSession,
    user_id: str,
    note_id: str,
    title: str,
    body: str,
    tags: list[str] | None = None,
) -> dict | None:
    if not _USE_DB_BACKEND:
        return _update_fallback_note(user_id, note_id, title, body, tags)

    async def _db_update() -> dict | None:
        query = select(NoteModel).where(
            NoteModel.id == _parse_uuid(note_id),
            NoteModel.user_id == _parse_uuid(user_id),
        )
        result = await db.execute(query)
        note = result.scalar_one_or_none()
        if not note:
            return None

        note.title = title
        note.body = body
        if tags is not None:
            note.tags = tags
        note.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(note)
        return _note_to_dict(note)

    try:
        return await asyncio.wait_for(_db_update(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception:
        return _update_fallback_note(user_id, note_id, title, body, tags)
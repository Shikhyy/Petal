from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
import re
from slowapi import Limiter
from slowapi.util import get_remote_address

from google import genai

from ...config import settings
from ...db.supabase import get_db
from ...api.middleware import get_user_or_dev
from ...db.models import NoteCreate, NoteUpdate, Note

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

_genai_client = None


def get_genai_client():
    """Get cached GenAI client for embeddings."""
    global _genai_client
    if _genai_client is None:
        api_key = settings.GEMINI_API_KEY
        if api_key:
            _genai_client = genai.Client(api_key=api_key)
    return _genai_client


def _text_search_score(note: dict, query: str) -> int:
    haystack = f"{note.get('title', '')} {note.get('body', '')} {' '.join(note.get('tags', []))}".lower()
    score = 0
    for term in [item for item in re.split(r"\s+", query.lower()) if item]:
        if term in haystack:
            score += 1
    return score


@router.get("/notes", response_model=list[Note])
@limiter.limit("60/minute")
async def get_notes(
    request: Request,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import notes_tools

        return await notes_tools.list_notes(db, user["user_id"], limit=limit)
    except Exception as e:
        logger.warning(f"DB unavailable for notes: {e}")
        return []


@router.post("/notes", response_model=Note, status_code=201)
@limiter.limit("30/minute")
async def create_note(
    request: Request,
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import notes_tools

        return await notes_tools.save_note(
            db,
            user_id=user["user_id"],
            title=data.title,
            body=data.body,
            tags=data.tags,
        )
    except Exception as e:
        logger.warning(f"DB unavailable for create_note: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.get("/notes/search")
async def search_notes(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import notes_tools

        client = get_genai_client()
        if client is None:
            notes = await notes_tools.list_notes(db, user["user_id"], limit=limit)
            ranked = sorted(notes, key=lambda note: _text_search_score(note, q), reverse=True)
            ranked = [note for note in ranked if _text_search_score(note, q) > 0][:limit]
            return {"query": q, "results": ranked, "mode": "text"}

        embedding_response = client.models.embed_content(
            model="text-embedding-004",
            contents=q,
        )
        query_embedding = embedding_response.embeddings[0].values

        results = await notes_tools.search_notes(
            db, user["user_id"], query_embedding, limit=limit
        )
        return {"query": q, "results": results, "mode": "semantic"}
    except Exception as e:
        logger.warning(f"Search failed: {e}")
        from ...tools import notes_tools

        notes = await notes_tools.list_notes(db, user["user_id"], limit=limit)
        ranked = sorted(notes, key=lambda note: _text_search_score(note, q), reverse=True)
        ranked = [note for note in ranked if _text_search_score(note, q) > 0][:limit]
        return {"query": q, "results": ranked, "mode": "text", "error": "Semantic search unavailable"}


@router.patch("/notes/{note_id}")
async def update_note(
    note_id: str,
    data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import notes_tools

        if data.deleted:
            deleted = await notes_tools.delete_note(db, user["user_id"], note_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Note not found")
            return {"status": "deleted", "id": note_id}

        updated = await notes_tools.update_note(
            db, user["user_id"], note_id, data.title or "", data.body or "", data.tags
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Note not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB unavailable for update_note: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_or_dev),
):
    try:
        from ...tools import notes_tools

        deleted = await notes_tools.delete_note(db, user["user_id"], note_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Note not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"DB unavailable for delete_note: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

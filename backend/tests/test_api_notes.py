import pytest


@pytest.mark.asyncio
async def test_create_note(client):
    response = await client.post(
        "/api/v1/notes",
        json={
            "title": "Test note",
            "body": "This is a test note",
            "tags": ["test"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test note"
    assert data["body"] == "This is a test note"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_notes(client):
    await client.post("/api/v1/notes", json={"title": "Note 1"})
    await client.post("/api/v1/notes", json={"title": "Note 2"})
    response = await client.get("/api/v1/notes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_delete_note(client):
    create_resp = await client.post("/api/v1/notes", json={"title": "Delete me"})
    note_id = create_resp.json()["id"]
    response = await client.delete(f"/api/v1/notes/{note_id}")
    assert response.status_code == 204

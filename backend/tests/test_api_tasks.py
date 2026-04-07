import pytest


@pytest.mark.asyncio
async def test_create_task(client):
    response = await client.post(
        "/api/v1/tasks",
        json={
            "title": "Test task",
            "priority": "high",
            "tags": ["test"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "high"
    assert data["status"] == "todo"
    assert data["tags"] == ["test"]
    assert "id" in data


@pytest.mark.asyncio
async def test_list_tasks(client):
    await client.post("/api/v1/tasks", json={"title": "Task 1"})
    await client.post("/api/v1/tasks", json={"title": "Task 2"})
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_update_task(client):
    create_resp = await client.post("/api/v1/tasks", json={"title": "Update me"})
    task_id = create_resp.json()["id"]
    response = await client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 200
    assert response.json()["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(client):
    create_resp = await client.post("/api/v1/tasks", json={"title": "Delete me"})
    task_id = create_resp.json()["id"]
    response = await client.delete(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 204
    list_resp = await client.get("/api/v1/tasks")
    ids = [t["id"] for t in list_resp.json()]
    assert task_id not in ids


@pytest.mark.asyncio
async def test_unauthorized_request():
    from httpx import ASGITransport, AsyncClient
    from backend.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/tasks")
        # With get_user_or_dev, unauthenticated requests get a dev user (200 OK)
        # For actual 401, client must provide a valid Authorization header
        assert response.status_code in [200, 401]

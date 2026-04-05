#!/usr/bin/env python3
"""
PETAL Agent Workflow Integration Tests
Run with: python scripts/test_workflows.py
Requires: valid .env with GCP credentials
"""

import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents.orchestrator import run_agent
from backend.config import settings

WORKFLOWS = [
    {
        "name": "Single-agent: Create Task",
        "input": "Create a high priority task called 'Review ADK documentation' due tomorrow",
        "expect_agents": ["task_agent"],
        "expect_keywords": ["task", "created", "high"],
    },
    {
        "name": "Single-agent: List Tasks",
        "input": "What are my high priority tasks?",
        "expect_agents": ["task_agent"],
        "expect_keywords": ["task"],
    },
    {
        "name": "Single-agent: Calendar Query",
        "input": "What meetings do I have tomorrow?",
        "expect_agents": ["cal_agent"],
        "expect_keywords": ["calendar", "event", "meeting"],
    },
    {
        "name": "Single-agent: Save Note",
        "input": "Save a note titled 'ADK Test' with content: Google ADK works great for multi-agent systems",
        "expect_agents": ["info_agent"],
        "expect_keywords": ["note", "saved"],
    },
    {
        "name": "Multi-agent: Schedule + Create Tasks",
        "input": "Schedule a product review meeting for next Monday at 2pm AND create 3 prep tasks for it",
        "expect_agents": ["cal_agent", "task_agent"],
        "expect_keywords": ["scheduled", "task", "created"],
    },
    {
        "name": "Multi-agent: Full Workflow",
        "input": "Help me plan my product launch: find relevant notes, create a launch checklist, and schedule a kickoff call for Friday",
        "expect_agents": ["info_agent", "task_agent", "cal_agent"],
        "expect_keywords": ["launch", "task", "event"],
    },
]

async def run_workflow_test(workflow: dict, session_prefix: str = "test") -> dict:
    session_id = f"{session_prefix}_{workflow['name'].replace(' ', '_').lower()[:20]}"
    print(f"\n{'='*60}")
    print(f"TEST: {workflow['name']}")
    print(f"INPUT: {workflow['input'][:80]}...")
    print(f"{'='*60}")

    try:
        result = await run_agent(workflow["input"], session_id)
        reply = result.get("reply", "")
        agents = result.get("agents_invoked", [])

        # Check expected agents
        agent_ok = all(
            any(exp in ag.lower() for ag in agents)
            for exp in workflow.get("expect_agents", [])
        )

        # Check expected keywords
        keyword_ok = all(
            kw.lower() in reply.lower()
            for kw in workflow.get("expect_keywords", [])
        )

        passed = agent_ok and keyword_ok
        status = "✅ PASS" if passed else "❌ FAIL"
        
        print(f"STATUS: {status}")
        print(f"AGENTS INVOKED: {agents}")
        print(f"AGENT CHECK: {'✓' if agent_ok else '✗'}")
        print(f"KEYWORD CHECK: {'✓' if keyword_ok else '✗'}")
        print(f"REPLY (first 200 chars): {reply[:200]}")
        
        return {"name": workflow["name"], "passed": passed, "result": result}

    except Exception as e:
        print(f"ERROR: {e}")
        return {"name": workflow["name"], "passed": False, "error": str(e)}


async def main():
    print("PETAL Agent Workflow Tests")
    print(f"Model: {settings.GEMINI_MODEL}")
    print(f"Project: {settings.GCP_PROJECT}")
    print()

    results = []
    for wf in WORKFLOWS:
        result = await run_workflow_test(wf)
        results.append(result)
        await asyncio.sleep(1)  # Rate limiting

    # Summary
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    print(f"\n{'='*60}")
    print(f"RESULTS: {passed}/{total} workflows passed")
    print(f"{'='*60}")
    for r in results:
        icon = "✅" if r["passed"] else "❌"
        print(f"  {icon} {r['name']}")

    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    asyncio.run(main())

import asyncio
from app.agent.graph import triage_graph


async def run_test(complaint: str, label: str):
    print(f"\n{'─'*50}")
    print(f"TEST: {label}")
    print(f"Complaint: {complaint}")

    initial_state = {
        "session_id": "test-session-001",
        "mrn": "MRN-00001",
        "raw_complaint": complaint,
        "reported_vitals": None,
    }

    result = await triage_graph.ainvoke(initial_state)

    # Add this temporarily
    print(f"Full result: {result}")

    print(f"ESI Level   : {result.get('esi_level')}")
    print(f"Disposition : {result.get('disposition_zone')}")
    print(f"Escalated   : {result.get('escalated')}")
    print(f"Reasoning   : {result.get('esi_reasoning')}")
    print(f"Last node   : {result.get('last_node')}")
    if result.get("error"):
        print(f"Error       : {result.get('error')}")


async def main():
    # ESI-1: should hit escalate node, skip disposition
    await run_test("patient is unresponsive, no pulse", "ESI-1 life threat")

    # ESI-2: high risk, should go to disposition → immediate_care
    await run_test("severe chest pain radiating to arm, pain 8/10", "ESI-2 high risk")

    # ESI-5: minor, should go to disposition → waiting_room
    await run_test("i need a prescription refill", "ESI-5 non-urgent")


if __name__ == "__main__":
    asyncio.run(main())
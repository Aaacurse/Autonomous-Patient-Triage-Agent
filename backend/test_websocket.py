import asyncio
import json
import websockets


async def test_triage():
    # paste your access token from the swagger login here
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc4MzQxMTUyNiwiaWF0IjoxNzgzNDA5NzI2fQ.LYbk7OXEM-V8OeashFX63uYMQm75ookkI0hKuEILb3I"
    uri = f"ws://localhost:8000/ws/triage?token={token}"

    async with websockets.connect(uri) as ws:
        # send complaint
        await ws.send(json.dumps({
            "complaint": "severe chest pain radiating to arm, pain 8/10",
            "mrn": "MRN-00001"
        }))

        # receive all events until connection closes
        while True:
            try:
                message = await ws.recv()
                event = json.loads(message)
                print(f"\nEvent: {event['event']}")
                print(f"Node : {event['node']}")
                print(f"Data : {json.dumps(event['data'], indent=2)}")
            except websockets.exceptions.ConnectionClosed:
                print("\nConnection closed")
                break


asyncio.run(test_triage())
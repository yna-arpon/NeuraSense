from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio

app = FastAPI()

@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    # Awaiting data from electron client to be processed 

    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()  # Receive data from client
            print("Recieved data: ", data)
            processed_data = data.upper()  # Process data (convert to uppercase)
            await websocket.send_text(processed_data)  # Send back processed data
    except WebSocketDisconnect:
        print("Client disconnected")
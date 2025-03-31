import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
from OpenBCI_Algorithm_Script import collect_data, processing_data
app = FastAPI()

@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    # Awaiting data from electron client to be processed 

    await websocket.accept()
    try:
        while True:
            data_chunk = None
            while not data_chunk:
                data = await websocket.receive_text()  # Receive data from client
                
                # waiting for queue to fill up
                data_chunk, state = collect_data(data)

            # Process the collected data when quee is full.
            processed_data = processing_data(data_chunk, state)

            print("Processed results:", processed_data, "is type", type(processed_data))

            # Convert the dictionary to a JSON string
            processed_data_json = json.dumps(processed_data)
            
            # Send back processed data
            await websocket.send_text(processed_data_json)  
           
    except WebSocketDisconnect:
        print("Client disconnected")
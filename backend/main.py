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
                data_chunk = collect_data(data)

            # Process the collected data when quee is full.
            DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, stroke = processing_data(data_chunk)

            print("Processed results:", DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, stroke)

            # Send back processed data
            await websocket.send_text(DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, stroke)  
           
    except WebSocketDisconnect:
        print("Client disconnected")
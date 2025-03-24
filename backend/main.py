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
                print("Recieved data")
                
                # waiting for queue to fill up
                data_chunk = collect_data(data)

            # Process the collected data when quee is full.
            DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, stroke = processing_data(data_chunk)

            print("Processed results:", DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, stroke)

            # Create a dictionary with the processed data
            processed_data = {
                "DAR": DAR,
                "DBR": DBR,
                "RBP_Alpha": RBP_Alpha,
                "RBP_Beta": RBP_Beta,
                "RD_Alpha": RD_Alpha,
                "RD_Beta": RD_Beta,
                "HI_Alpha": HI_Alpha,
                "HI_Beta": HI_Beta,
                "stroke": stroke
            }

            # Convert the dictionary to a JSON string
            processed_data_json = json.dumps(processed_data)
            
            # Send back processed data
            await websocket.send_text(processed_data_json)  
           
    except WebSocketDisconnect:
        print("Client disconnected")
import { ipcMain } from "electron";
import { WebSocket } from "ws";

export class BackendManager {
    ws: null | WebSocket
    url: string = "ws://localhost:8000/ws"

    constructor() {
        this.ws = null;
    }

    // Connect to ws
    async connectWS() {
        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log("[Backend Manager]: Connected to WebSocket server");
                resolve();  // Resolve the promise when the connection is open
            };

            this.ws.onmessage = (event) => {
                ipcMain.emit("processedDataRecieved", {}, event.data)
            };

            this.ws.onerror = (error) => {
                console.error("[Backend Manager]: WebSocket Error:", error);
                reject(error);  // Reject the promise on error
            };
        });
    }

    // Send data to ws
    sendData(data: any) {
        // const isPhantom = true;
        // const data = {
        //     packet: eegData,
        //     isPhantom
        // }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket is not connected. Call connectWS() first.");
        }
    }
    
    // Disconnect ws
    disconnectWS() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            console.log("WebSocket connection closed");
        }
    }
}
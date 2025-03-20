import { BrowserWindow, ipcMain } from "electron";
import * as dgram from "dgram";
import { Console } from "console";

// Port and IP address defined by OpenBCI GUI
const PORT = 12345;
const HOST = "127.0.0.1"

let server: dgram.Socket | null


export const setupUDPListener = (mainWindow: BrowserWindow) => {
    // Create UDP server
    server = dgram.createSocket('udp4');

    server.on('listening', () => {
        const address = server?.address();
        console.log(`[EEG LISTENER]: UDP Server listening on: ${address?.address}:${address?.port}`)
    });

    server.on('message', (data) => {
        try {
            // Convert Buffer to string 
            const dataString = data.toString('utf-8');

            // Parse the string into JSON
            const message = JSON.parse(dataString);

            ipcMain.emit('eegDataRecieved', {} as Event, message);
        } catch(error) {
            console.error('Error parsing message', error)
        }
    })

    server.bind(PORT, HOST)
}

export const disconnectUDP = () => {
    console.log("entered disconnectUDP")
    if (server) {
        console.log("Trying to disconnect")
        server.close(() => {
            console.log("[EEG LISTENER]: UDP Server disconnected.");
        });
        server = null;
    } else {
        console.log("[EEG Listener]: No active UDP server to disconnect.")
    }
}
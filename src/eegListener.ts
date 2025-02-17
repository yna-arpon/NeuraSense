import { ipcRenderer } from "electron";
import * as dgram from "dgram";

// Port and IP address defined by OpenBCI GUI
const PORT = 12345;
const HOST = "127.0.0.1"

export const setupUDPListener = () => {
    // Create UDP server
    const server = dgram.createSocket('udp4');

    server.on('listening', () => {
        const address = server.address();
        console.log(`[EEG LISTENER]: UDP Server listening on: ${address.address}:${address.port}`)
    });

    server.on('message', (data) => {
        try {
            // Convert Buffer to string 
            const dataString = data.toString('utf-8');

            // Parse the string into JSON
            const message = JSON.parse(dataString);

            console.log(message)

           // ipcRenderer.send('eggDataRecieved', data)
        } catch(error) {
            console.error('Error parsing message', error)
        }
    })

    server.bind(PORT, HOST)
}


import { app, ipcMain, BrowserWindow, shell, screen, dialog, IpcMainEvent } from "electron"
import path from "path";
import { DatabaseManager } from "./controllers/databaseManager";
import { eventNames } from "process";
import { setupUDPListener, disconnectUDP } from "./eegListener";
import { BackendManager } from "./controllers/backendManager";
import { connect } from "http2";
import { start } from "repl";

const isDev = process.env.NODE_ENV !== "production"
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';

// Get icon path
const baseDir = path.join(__dirname, "..", "assets", "images", "icons");
let iconDir = ""

if (isMac) {
    iconDir = path.join(baseDir, "NeuraSense Logo.icns");
} else if (isWin) {
    iconDir = path.join(baseDir, "NeuraSense Logo.ico");
} else {
    iconDir = path.join(baseDir, "NeuraSense Logo.png");
}

let mainWindow : BrowserWindow;

const databaseManager = new DatabaseManager();
const backendManager = new BackendManager();

let currentPage: string = "home"; // Initialize current page state
let lastPage: string;
let isSim: boolean = false;

app.on("ready", createWindows);

function createWindows(): void {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, "..", "assets", "images", "icons", "NeuraSense Logo.icns"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    if(isDev) {
        // Open dev tools if in dev env 
        mainWindow.webContents.openDevTools();
        
        // Insert sample data if dev env
        // databaseManager.insertSampleData()
    }

    mainWindow.loadFile(path.join(__dirname, "./index.html"));
    mainWindow.on("ready-to-show", () => mainWindow.show());
}

// ------------------------------- NAVIGATION FUNCTIONALITY -------------------------------

// Navigate to specific page
ipcMain.on("navigate", (event, page) => {
    event.sender.send("navigate", page)
})

// Launch help page
ipcMain.on("launchHelp", () => {
    let externalURL = "http://google.com" // To be changed with NeuraSense landing page
    shell.openExternal(externalURL)
})

// ------------------------------- HISTORY PAGE FUNCTIONALITY -------------------------------

// Listen for request to display history page
ipcMain.on("prepareTable", async (event) => {

    // Prepare data
    const data = await databaseManager.getData();

    const preparedData = formatData(data);
    
    event.sender.send("showHistoryTable", preparedData);
});

// Format data to display in history table
function formatData(data: any[]) {
    let formattedData: String[][] = [];

    data.forEach(record => {
        let arr: String[] = [
            record.recordID.toString(),
            record.patientName, 
            record.healthNumber.toString(), 
            record.birthdate.toDateString(),
            `${record.ecmoStart.toLocaleDateString()} - ${record.ecmoEnd.toLocaleDateString()}`,
            // To do: edit type once we turn this into an actual file
            record.eegFile ? `[File: ${record.eegFile.length} bytes]` : "-",
            record.fNIRSFile ? `[File: ${record.fNIRSFile.length} bytes]` : "-"
        ]
        formattedData.push(arr)
    })

    return formattedData
}

// Delete record from database 
ipcMain.on("deleteRecord",(event, recordID) => {
    deleteRecordFromDB(event, recordID)
        .then(async () => {
            console.log(`[MAIN PROCESS]: Successfully deleted record ID ${recordID}`);
            const data = formatData(await databaseManager.getData())
            event.sender.send("showHistoryTable", data); // Rerender history table
        })
        .catch((error) => {
            console.error(`[MAIN PROCESS]: Failed to delete record ID ${recordID}`)
        })
})

ipcMain.handle("confirmRecordDelete", async () => {
    const response = await confirmAction('Confirm Deletion', 
        'Are you sure you want to delete this record?', 
        ['Delete', 'Cancel'])
    return response
})

async function deleteRecordFromDB(event: IpcMainEvent, recordID: number) {
    try { 
       await databaseManager.deleteRecord(recordID);
    } catch (error) {
        throw new Error("Failed to delete record from database")
    }
}

// ------------------------------- RECORDING PAGE FUNCTIONALITY -------------------------------

// Add patient to database after user fills out form 
ipcMain.on("submitPatientForm", (event, formEntries: { name: string, healthNum: number, birthdate: string, 
    ecmoReason: string, acuteSituation: string, riskFactors: string, medications: string}) => {

    // Add patient to database
    addPatientToDB(event, formEntries)
        .then(async () => {

            showRecordingPage(event, formEntries);

            // Initialize connection to OpenBCI server
            setupUDPListener(mainWindow);

            // Connect to websocket
            connectToWS();
        })
        .catch((error) => {
            console.log(error)
            console.error(`[MAIN PROCESS]: Failed to add ${formEntries.name} to DB`)
        })
})

async function showRecordingPage(event: Electron.IpcMainEvent, 
    formEntries: { name: string, healthNum: number, birthdate: string, 
    ecmoReason: string, acuteSituation: string, riskFactors: string, medications: string}) {
    
    // Get patient data using .then()
    databaseManager.getPatientData(formEntries.healthNum)
        .then(patientData => {
            // Hide form and show recording page
            event.sender.send("showRecordingPage", patientData);
        })
        .catch(error => {
            console.error("Error fetching patient data:", error);
        });
}

async function addPatientToDB(event: IpcMainEvent, 
    formEntries: { name: string, healthNum: number, birthdate: string, 
        ecmoReason: string, acuteSituation: string, riskFactors: string, medications: string}) {
    try {
        await databaseManager.addPatientRecord(formEntries);
    } catch (error) {
        throw new Error("Unable to add patient to database")
    }
}

async function connectToWS() {
    await backendManager.connectWS()
}

async function sendEEGData(eegData: any, isSim: boolean) {
    const data = {
        packet: eegData,
        isPhantom: isSim
    }

    try {
        // const jsonData = JSON.stringify(data); // Convert object to JSON string
        backendManager.sendData(data); 
    } catch (error) {
        console.error("Error serializing EEG data:", error);
    }
}

ipcMain.on('toggleSimulation', (event, simVal) => {
    // Change simulation state
    isSim = simVal
})

// Recieved EEG Data
ipcMain.on('eegDataRecieved', async (event, eegData) => {
    // Send EEG data to be displayed on recoridng page
    mainWindow.webContents.send('displayEEGData', eegData);

    // Send EEG data to sever for processing
    await sendEEGData(eegData, isSim);
})


ipcMain.on('processedDataRecieved', (event, processedData) => {
    const data = JSON.parse(processedData);  // Safely parse the JSON string
    if (mainWindow) {
        console.log("Sending Data to Renderer:", data);
        mainWindow.webContents.send("updateStrokeMeasures", data);
    }
})

// End recording session 
ipcMain.on("endRecordingSession", (event, healthNum: number) => {
    console.log("Ending ECMO Recording")
    databaseManager.addRecord(healthNum, new Date(), new Date())
    disconnectUDP();
    backendManager.disconnectWS()
})

ipcMain.handle("confirmEndSession", async () => {
    const response = await confirmAction('Confirm End Session', 
        'Are you sure you want to end the session?', 
        ['End Session', 'Cancel'])
    return response
})

// ------------------------------- MISC APP FUNCTIONALITY -------------------------------

async function confirmAction(title: string, message: string, buttons: string[]) {
    const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: title,
        message: message,
        buttons: buttons,
        defaultId: 0,
        cancelId: 1
    }); 

    return response
}

// When user closes the appliction
app.on('window-all-closed', () => {
    // Clear db if dev mode
    if(isDev) {
        databaseManager.clearDatabase()
    }

    if (!isMac) {
        app.quit()
    }    
})
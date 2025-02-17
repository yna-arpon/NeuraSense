import { app, ipcMain, BrowserWindow, shell, screen, ipcRenderer, IpcMainEvent } from "electron"
import path from "path";
import { DatabaseManager } from "./controllers/databaseManager";
import { eventNames } from "process";

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

const databaseManager = new DatabaseManager()

let currentPage: string = "home" // Initialize current page state
let lastPage: string

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
        databaseManager.insertSampleData()
    }

    mainWindow.loadFile(path.join(__dirname, "./index.html"));
    mainWindow.on("ready-to-show", () => mainWindow.show())
}

ipcMain.on("navigate", (event, page) => {
    event.sender.send("navigate", page)
})

ipcMain.on("launchHelp", () => {
    let externalURL = "http://google.com" // To be changed with NeuraSense landing page
    shell.openExternal(externalURL)
})

// Listen for request to display history page
ipcMain.on("prepareTable", async (event) => {
    // Prepare data
    const data = await databaseManager.getData();

    const preparedData = formatData(data)
    
    event.sender.send("showHistoryTable", preparedData);
});

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

async function deleteRecordFromDB(event: IpcMainEvent, recordID: number) {
    try {
       await databaseManager.deleteRecord(recordID);
    } catch (error) {
        throw new Error("Failed to delete record from database")
    }
}

ipcMain.on("submitPatientForm", (event, formEntries: { name: string, healthNum: number, birthdate: string}) => {
    // Add patient to database
    addPatientToDB(event, formEntries)
        .then(async () => {
            console.log("Patient successfully added to DB");
            // Hide Form and show recording page
            event.sender.send("showRecordingPage")
        })
        .catch((error) => {
            console.error(`[MAIN PROCESS]: Failed to add ${formEntries.name} to DB`)
        })
})

async function addPatientToDB(event: IpcMainEvent, formEntries: { name: string, healthNum: number, birthdate: string}) {
    try {
        await databaseManager.addPatientRecord(formEntries);
    } catch (error) {
        throw new Error("Unable to add patient to database")
    }
}

ipcMain.on("endRecordingSession", (event) => {
    event.sender.send("home")
})

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
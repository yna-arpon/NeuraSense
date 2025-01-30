import { app, ipcMain, BrowserWindow, shell, screen, ipcRenderer, IpcMainEvent } from "electron"
import path from "path";
import { DatabaseManager } from "./controllers/databaseManager";
import { eventNames } from "process";

const isDev = process.env.NODE_ENV !== "production"
const isMac = process.platform === 'darwin';

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
    event.reply("historyPageReady");
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

       const remainingData = await databaseManager.getData();
       console.log("[MAIN PROCESS]: Data after deletion:", remainingData.length);
    } catch (error) {
        throw new Error("Failed to delete record from database")
    }
}

// When user closes the appliction
app.on('window-all-closed', () => {
    // Clear db if dev mode
    if(isDev) {
        console.log("clear db")
        databaseManager.clearDatabase()
    }

    if (!isMac) {
        app.quit()
    }    
})
import { app, ipcMain, BrowserWindow, shell, screen, ipcRenderer } from "electron"
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
        
        // Open dev tools if in dev env 
        databaseManager.insertSampleData()
    }

    console.log(__dirname)

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
ipcMain.on("prepareDatabse", (event) => {
    // Prepare data
    const data = databaseManager.getData();

    let preparedData: String[][] = [];

    data.forEach(record => {
        let arr: String[] = [
            record.patientName, 
            record.healthNumber.toString(), 
            record.birthdate.toDateString(),
            `${record.ecmoStart.toLocaleDateString()} - ${record.ecmoEnd.toLocaleDateString()}`,
            // To do: edit type once we turn this into an actual file
            record.eegFile ? `[File: ${record.eegFile.length} bytes]` : "-",
            record.fNIRSFile ? `[File: ${record.fNIRSFile.length} bytes]` : "-"
        ]

        preparedData.push(arr)
    })
    
    event.sender.send("showHistoryTable", preparedData)
})


// When user closes the appliction
app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }

    // Clear db if dev mode
    if(isDev) {
        console.log("clear db")
        databaseManager.clearDatabase()
    }
})
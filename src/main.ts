import { app, ipcMain, BrowserWindow, shell, screen, ipcRenderer } from "electron"
import path from "path";
import { DatabaseManager } from "./controllers/databaseManager";

const isDev = process.env.NODE_ENV !== "production"
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

    // Open dev tools if in dev env 
    if(isDev) {
        mainWindow.webContents.openDevTools();
    }

    console.log(__dirname)
    
    // Insert sample data from db 
    databaseManager.insertSampleData()

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
import { app, ipcMain, BrowserWindow } from "electron"
import path from "path";

const isDev = process.env.NODE_ENV !== 'production'
let mainWindow : BrowserWindow;

app.on("ready", createWindows);

function createWindows(): void {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
        },
        show: false
    });

    // Open dev tools if in dev env 
    if(isDev) {
        mainWindow.webContents.openDevTools();
    }

    console.log(__dirname)

    mainWindow.loadFile(path.join(__dirname, "./pages/home/home.html"));
    mainWindow.on("ready-to-show", () => mainWindow.show())
}
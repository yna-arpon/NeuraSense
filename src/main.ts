import { app, ipcMain, BrowserWindow } from "electron"
import path from "path";

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

    mainWindow.loadFile(path.join(__dirname, "../src/index.html"));
    mainWindow.on("ready-to-show", () => mainWindow.show())
}
import { app, ipcMain, BrowserWindow, shell} from "electron"
import path from "path";

const isDev = process.env.NODE_ENV !== "production"
let mainWindow : BrowserWindow;

let currentPage: string = "home" // Initialize current page state
let lastPage: string

app.on("ready", createWindows);

function createWindows(): void {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
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

    mainWindow.loadFile(path.join(__dirname, "./pages/home/home.html"));
    mainWindow.on("ready-to-show", () => mainWindow.show())
}


// Navigation
ipcMain.on("goToPage", (event, page) => {
    console.log(`Navigating to ${page} page`)

    if (mainWindow) {
        if (currentPage !== page) {
            lastPage = currentPage
            currentPage = page

            let pageFile
            switch (page) {
                case "recording":
                    pageFile = path.join(__dirname, "./pages/recording/recording.html");
                    break
                case "history":
                    pageFile = path.join(__dirname, "./pages/history/history.html");
                    break
                case "settings":
                    pageFile = path.join(__dirname, "./pages/settings/settings.html");
                    break
                case "help":
                    let externalURL = "http://google.com" // To be changed with NeuraSense landing page
                    shell.openExternal(externalURL)
                    break
                default:
                    console.log(`[Main Process] Unknown Page ${page}`)
            }

            if (pageFile) {
                mainWindow.loadFile(pageFile)
            }   
            
        }
    }
})
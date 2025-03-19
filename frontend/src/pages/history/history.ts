import { Data, ipcRenderer } from "electron";
import { BasePage } from "../../controllers/basePage";

export class HistoryPage extends BasePage {

    constructor() {
        super("history");
    }

    initialize(): void {
        super.initialize();
        console.log("[HistoryPage] Setting up history page functionality.");
        
        // Get and render the history data
        this.displayHistory();
    }

    displayHistory(): void {
        // Send function to main - send table, and datasbase
        ipcRenderer.send("prepareTable");
    }
}
import { Data, ipcRenderer } from "electron";
import { BasePage } from "../../controllers/basePage";

export class HistoryPage extends BasePage {

    constructor() {
        super("recording");
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

        ipcRenderer.once("historyTableReady", () => {
            this.handleDeletion();
        })
    }

    handleDeletion(): void {
        const deleteBtns = document.querySelectorAll(".deleteBtn");
        
        deleteBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                
                const recordID = Number(btn.getAttribute("recordID"));
                console.log(`[HISTORY RENDERER] Clicking delete for ${recordID}, ${typeof(recordID)}`);

                if (recordID) {
                    ipcRenderer.send("deleteRecord", recordID);
                } else {
                    console.error("[HISTORY RENDERER]: Record ID not found");
                }
            })
        })
    }
}
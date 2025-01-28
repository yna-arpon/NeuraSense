import { Data } from "electron";
import { BasePage } from "../../controllers/basePage";
import { DatabaseManager } from "../../controllers/databaseManager";
import { table } from "console";

export class HistoryPage extends BasePage {
    private databaseManager: DatabaseManager;

    constructor() {
        super("recording");
        this.databaseManager = new DatabaseManager();
    }

    initialize(): void {
        super.initialize();
        console.log("[HistoryPage] Setting up history page functionality.");
        
        // Get and render the history data
        this.displayHistory();
    }

    displayHistory(): void {
        console.log("Trying to display history")
        // Get data from the database
        const data = this.databaseManager.getData();

        const tableBody = document.querySelector<HTMLTableSectionElement>('#historyTableBody');

        if(!tableBody) {
            console.error('[HISTORY RENDENER]: Table body element not found')
            return;
        }

        // Clear rows
        tableBody.innerHTML = ""

        // Empty dataset
        if (data.length === 0) {
            // Add a row to indicate no data
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 7; // Spanning all columns
            cell.textContent = "No history records found.";
            cell.style.textAlign = "center";
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        // Populate the table with data
        data.forEach(record => {
            const row = document.createElement("tr");

            // Populate row with data
            row.appendChild(this.createCell(record.healthNumber.toString()));
            row.appendChild(this.createCell(record.patientName));
            row.appendChild(this.createCell(record.birthdate.toLocaleDateString()));
            row.appendChild(this.createCell(record.ecmoStart.toLocaleDateString()));
            row.appendChild(this.createCell(record.ecmoEnd.toLocaleDateString()));
            row.appendChild(this.createCell(record.eegFile ? `[File: ${record.eegFile.length} bytes]` : "-"));
            row.appendChild(this.createCell(record.fNIRSFile ? `[File: ${record.fNIRSFile.length} bytes]` : "-"));

            // Append row to table body
            tableBody.appendChild(row)
        });
    }
    
    private createCell(content: string): HTMLTableCellElement {
        const cell = document.createElement("td");
        cell.textContent = content;
        return cell;
    }
}
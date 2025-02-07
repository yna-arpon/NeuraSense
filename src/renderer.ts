import { ipcRenderer } from "electron";

import { NavBar } from "./components/navbar";
import { PageManager } from "./controllers/pageManager";

const navBarContainer = document.getElementById("navBarDiv");
const pageContentsDiv = document.getElementById("pageContents");
const pageManager = new PageManager()

// Append the navigation bar once
const navBar = new NavBar();
if (navBarContainer) {
    navBar.appendTo(navBarContainer);
    setupNavigation()
}

// Function to load a page
function loadPage(page: string) {
    if (page == "help") {
        ipcRenderer.send("launchHelp")
    } else {
        const filePath = `./pages/${page}/${page}.html`

        // Load the HTML content for the page
        fetch(filePath)
            .then(response => response.text())
            .then(html => {
                if (pageContentsDiv) {
                    // Populate pageContentsDiv with HTML page template
                    pageContentsDiv.innerHTML = html;

                    // Initialize page functionality
                    pageManager.setupPage(page)
                }
            })
            .catch(err => console.error(`Error loading page "${page}":`, err));
    }    
}

// Nav bar navigation functionality
function setupNavigation() {
    console.log("[RENDERER] Setting up navigation")
    const navBtns = document.querySelectorAll<HTMLButtonElement>(".navBtn");

    navBtns.forEach((btn) => {
        btn.addEventListener(("click"), () => {
            const page = btn.getAttribute("data-page")
            if (page) {
                if (page == "help") {
                    ipcRenderer.send("launchHelp")
                } else {
                    loadPage(page)
                }
            } else {
                console.error(`Error loading page "${page}"`)
            }
            
        })
    })         
}

// Load home page on start
loadPage("home")

// Page navigation functionality
ipcRenderer.on("navigate", (event, page) => {
    loadPage(page)
})

// Render history page
ipcRenderer.on("showHistoryTable", (event, data) => {
    // Get table
    const tableBody = document.querySelector<HTMLTableSectionElement>('#historyTableBody');

    if(!tableBody) {
        console.error('[RENDENER]: Table body element not found')
        return;
    }

    // Clear rows
    tableBody.innerHTML = ""

    // Empty dataset
    if (data.length === 0) {
        emptyDatabase(tableBody)
        return;
    }

    data.forEach((recording: string[]) => {
        // Populate row with data 
        const row: HTMLTableRowElement = populateHistoryTableRows(recording);

        // Create delete button 
        const deleteCell = createDeleteCell(recording);
        
        row.appendChild(deleteCell)

        // Append row to table body
        tableBody.appendChild(row)
    })

    attachDeleteListeners()
});

function populateHistoryTableRows(recording: string[]): HTMLTableRowElement {
    const row = document.createElement("tr");
        
    // Populate row with data
    let colNum: number = 1;
    let totCols: number = 6;
    
    while (colNum <= totCols) {
        row.appendChild(createCell(recording[colNum]));
        colNum++;
    }

    return row;
}

function createDeleteCell(recording: string[]): HTMLTableCellElement {
    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("deleteBtn");
    deleteButton.innerHTML = `<i class="bi bi-trash"></i>`; // Bootstrap trash icon
    deleteButton.setAttribute("recordID", recording[0]); 
    deleteCell.appendChild(deleteButton);
    return deleteCell
}

function attachDeleteListeners(): void {
    const deleteBtns = document.querySelectorAll(".deleteBtn");
    
    deleteBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const recordID = Number(btn.getAttribute("recordID"));

            if (recordID) {
                ipcRenderer.send("deleteRecord", recordID);
            } else {
                console.error("[HISTORY RENDERER]: Record ID not found");
            }
        })
    })
}

function emptyDatabase(tableBody: HTMLTableSectionElement) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7; // Spanning all columns
    cell.textContent = "No history records found.";
    cell.style.textAlign = "center";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
}

function createCell(content: string): HTMLTableCellElement {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
}
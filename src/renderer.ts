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
                console.log(`[RENDERER] "${page}" was clicked`)
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
    console.log(`[RENDERER] Navigating to ${page}`)
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

    data.forEach((recording: string[]) => {
        const row = document.createElement("tr");
        
        let rowNum: number = 0;
        let totRows: number = 6
        
        while (rowNum <= totRows) {
            row.appendChild(createCell(recording[rowNum]))
            rowNum++
        }

        // Append row to table body
        tableBody.appendChild(row)
    })
})

function createCell(content: string): HTMLTableCellElement {
    const cell = document.createElement("td");
    cell.textContent = content;
    return cell;
}
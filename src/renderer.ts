import { ipcRenderer } from "electron";

import { NavBar } from "./components/navbar";
import { PageManager } from "./controllers/pageManager";
import { Chart, registerables } from "chart.js";

const navBarContainer = document.getElementById("navBarDiv") as HTMLDivElement;
const pageContentsDiv = document.getElementById("pageContents") as HTMLDivElement;
const pageManager = new PageManager()

// Register necessary components
Chart.register(...registerables);

// ------------------------------- NAVIGATION FUNCTIONALITY -------------------------------
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

// ------------------------------- HISTORY PAGE FUNCTIONALITY -------------------------------

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

// ------------------------------- RECORDING PAGE FUNCTIONALITY -------------------------------

// Hide patient form and show recording page
ipcRenderer.on("showRecordingPage", (event) => {
    // Hide patient form
    const patientForm = document.getElementById("addPatientDiv") as HTMLDivElement;
    patientForm.style.display = "none"

    // Show recording page
    const recordingPage = document.getElementById("recordingDiv") as HTMLDivElement;
    recordingPage.style.display = "flex"

    // Hide nav bar - once we enter the recording page
    navBarContainer.style.display = "none"

    // Resyle page contents div 
    pageContentsDiv.style.paddingLeft = "0"
    pageContentsDiv.style.margin = "3.5vw" 

    // Later for reference - original page contents styling
    // padding-left: 5%;
    // margin: 0vw 5vw 0vw 3vw;

    // Create EEG and fNIRS graphs
    createEGGraphs();
    createfNIRSGraphs();
});

// Colors for each channel
const channelColors = {
    af7: 'rgb(220, 20, 60)', // Red
    af8: 'rgb(0, 112, 220)', // Blue
    tp9: 'rgb(50, 205, 50)', // Green
    tp8: 'rgb(255, 165, 0)', // Orange
};
  
// Store references to charts
const charts: { [key: string]: Chart } = {};
  
// Create graphs without legends
function createGraph(canvasId: string, borderColor: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`${canvasId} canvas not found!`);
      return;
    }
  
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Failed to get 2D context for ${canvasId} graph!`);
      return;
    }
  
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(50).fill(''), // Labels for X-axis
        datasets: [
          {
            label: canvasId.replace('Canvas', ''), // Remove 'Canvas' from ID for label
            data: Array.from({ length: 50 }, () => Math.random() * 2), // Replace with actual EEG data
            borderColor: borderColor,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Ensure graph adapts to canvas size
        animation: false, // Disable animation for smoother updates
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false }, // Disable individual chart legends
        },
      },
    });
  
    // Save reference to the chart for later updates
    charts[canvasId] = chart;
}
  
  // Add consolidated legend
function createLegend(legendID:string) {
    const legendContainer = document.getElementById(legendID);
    if (!legendContainer) {
        console.error('Legend container not found!');
        return;
    }

    legendContainer.innerHTML = ''; // Clear existing legends

    // Add a legend item for each channel
    Object.entries(channelColors).forEach(([channel, color]) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        const label = document.createElement('span');
        label.textContent = channel.toUpperCase();

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}
  
  // Update data in real-time
function updateGraphs() {
    Object.keys(charts).forEach((canvasId) => {
        const chart = charts[canvasId];

        // Add new random data point (replace with actual EEG data if available)
        const newData = Math.random() * 2;
        chart.data.datasets[0].data.push(newData);

        // Remove the oldest data point
        if (chart.data.datasets[0].data.length > 50) {
        chart.data.datasets[0].data.shift();
        }

        // Update the chart
        chart.update();
    });
}
  
// Create all EEG graphs and the consolidated legend
function createEGGraphs() {
    createGraph('af7EEGCanvas', channelColors.af7);
    createGraph('af8EEGCanvas', channelColors.af8);
    createGraph('tp9EEGCanvas', channelColors.tp9);
    createGraph('tp8EEGCanvas', channelColors.tp8);

    createLegend('legendEEGContainer'); // Add consolidated legend

    // Start updating graphs every 100ms
    setInterval(updateGraphs, 100);
}

// Create all EEG graphs and the consolidated legend
function createfNIRSGraphs() {
    createGraph('af7fNIRSCanvas', channelColors.af7);
    createGraph('af8fNIRSCanvas', channelColors.af8);
    createGraph('tp9fNIRSCanvas', channelColors.tp9);
    createGraph('tp8fNIRSCanvas', channelColors.tp8);

    createLegend('legendfNIRSContainer'); // Add consolidated legend

    // Start updating graphs every 100ms
    setInterval(updateGraphs, 100);
}
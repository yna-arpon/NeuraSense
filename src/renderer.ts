import { ipcRenderer } from "electron";

import { NavBar } from "./components/navbar";
import { PageManager } from "./controllers/pageManager";
import { Chart, registerables } from "chart.js";

const navBarContainer = document.getElementById("navBarDiv") as HTMLDivElement;
const pageContentsDiv = document.getElementById("pageContents") as HTMLDivElement;
const pageManager = new PageManager()

// Register necessary components
Chart.register(...registerables);

interface EEGData {
    ch1?: number[],
    ch2?: number[],
    ch3?: number[],
    ch4?: number[],
}

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
    deleteButton.innerHTML = `<i class="bi bi-trash3"></i>`; // Bootstrap trash icon
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
                ipcRenderer.invoke("confirmRecordDelete").then((result: Electron.MessageBoxReturnValue) => {
                    if (result.response === 0) {
                        ipcRenderer.send("deleteRecord", recordID);
                    }
                })
            } else {
                console.error("[HISTORY RENDERER]: Record ID not found");
            }
        })

        btn.addEventListener('mouseover', () => {
            btn.innerHTML = `<i class="bi bi-trash3-fill"></i>`; // Filled trash icon
        })

        btn.addEventListener('mouseout', () => {
            btn.innerHTML = `<i class="bi bi-trash3"></i>`; // trash icon
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

    // Add event listener to end session button
    const endSessionBtn = document.getElementById("endSessionBtn") as HTMLButtonElement;
    endSessionBtn.addEventListener('click', (event) => {
        ipcRenderer.invoke("confirmEndSession").then((result: Electron.MessageBoxReturnValue) => {
            if (result.response === 0) {
                endSession()
            }
        })
    })

    // Create EEG and fNIRS graphs
    createEGGraphs();
    createfNIRSGraphs();
});

function endSession() {
    navBarContainer.style.display = "flex"

    // Reset page styling div 
    pageContentsDiv.style.paddingLeft = "5%"
    pageContentsDiv.style.margin = "0vw 5vw 0vw 3vw" 
    
    // Clear intervals 
    clearInterval(fNIRSInterval);

    // Navigate back home
    loadPage("home")
}

// Create all EEG graphs and the consolidated legend
function createEGGraphs() {
    createGraph('ch1EEGCanvas', channelColors.ch1);
    createGraph('ch2EEGCanvas', channelColors.ch2);
    createGraph('ch3EEGCanvas', channelColors.ch3);
    createGraph('ch4EEGCanvas', channelColors.ch4);

    createLegend('legendEEGContainer'); // Add consolidated legend
}

let fNIRSInterval: string | number | NodeJS.Timeout | undefined;

// Create all EEG graphs and the consolidated legend
function createfNIRSGraphs() {
    createGraph('af7fNIRSCanvas', channelColors.ch1);
    createGraph('af8fNIRSCanvas', channelColors.ch2);
    createGraph('tp9fNIRSCanvas', channelColors.ch3);
    createGraph('tp8fNIRSCanvas', channelColors.ch4);

    createLegend('legendfNIRSContainer'); // Add consolidated legend

    // Start updating graphs every 100ms
    // fNIRSInterval = setInterval(updateGraphs, 100);
}

// Colors for each channel
const channelColors = {
    ch1: 'rgb(220, 20, 60)', // Red
    ch2: 'rgb(0, 112, 220)', // Blue
    ch3: 'rgb(50, 205, 50)', // Green
    ch4: 'rgb(255, 165, 0)', // Orange
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
            data: [], //
            borderColor: borderColor,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Ensure graph adapts to canvas size
        animation: false, // Disable animation for smoother updates
        scales: {
          x: { grid: { display: false } },
          y: { 
            grid: { display: false },
            max: 800,
            min: -800
        },
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

// Update EEG Graph when we recieve EEG data
ipcRenderer.on('displayEEGData', (event, eegMessage) => {
    // Ensure data is structured correctly
    if (!eegMessage || !Array.isArray(eegMessage.data)) {
        console.error("Invalid EEG data format:", eegMessage);
        return;
    }

    const eegChannels = ["ch1", "ch2", "ch3", "ch4"];
    const eegData: { [key: string]: number[] } = {};

    // Map each row of incoming EEG data into the respective channel 
    eegChannels.forEach((channel, index) => {
        eegData[channel] = eegMessage.data[index] || [];
    })

    updateEEGGraphs(eegData)
})

function updateEEGGraphs(eegData: EEGData) {
    Object.entries(eegData).forEach(([channel, newData]) => {
        const canvasId = `${channel}EEGCanvas`; 
        const chart = charts[canvasId];

        if (!chart) {
            console.warn(`Chart for ${canvasId} not found.`);
            return;
        }

        if (!Array.isArray(newData) || newData.length === 0) {
            console.warn(`Invalid or empty data for ${channel}:`, newData);
            return;
        }
        
        if (chart && Array.isArray(newData)) {
            // Push new data points into the chart
            chart.data.datasets[0].data.push(...newData);

            // Keep only the last 50 data points
            while (chart.data.datasets[0].data.length > 50) {
                chart.data.datasets[0].data.shift();
            }

            // Update the chart
            chart.update();
        }
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
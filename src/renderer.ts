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
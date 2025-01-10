import  * as fs from 'fs';
import * as path from 'path';
import { ipcRenderer } from "electron";



export class NavBar {
    private element: HTMLElement;

    constructor() {
        // Read HTML component
        const navBar = fs.readFileSync(path.join(__dirname, 'navbar.html'), 'utf-8');

        // Create a container for nav bar
        this.element = document.createElement('div');
        this.element.innerHTML = navBar
    }

    // Method to append nav bar to a container
    appendTo(container: HTMLElement) {
        container.appendChild(this.element)
        this.setUpNavigation()
    }

    // Navigation functionality
    private setUpNavigation() {
        const navBtns = document.querySelectorAll<HTMLButtonElement>(".navBtn");
        navBtns.forEach((btn) => {
            btn.addEventListener(("click"), () => {
                console.log(`[Nav Bar Renderer] "${btn.id}" was clicked`)
        
                let page
                switch(btn.id) {
                    case "homePageBtn":
                        page = "home";
                        break
                    case "recordingPageBtn":
                        page = "recording";
                        break
                    case "historyPageBtn":
                        page = "history";
                        break
                    case "settingsPageBtn":
                        page = "settings";
                        break
                    case "helpPageBtn":
                        page = "help";
                        break
                    default:
                        console.log("Unknown button clicked");
                        break
                }
        
                ipcRenderer.send("goToPage", page)
            })
        })
    }
}
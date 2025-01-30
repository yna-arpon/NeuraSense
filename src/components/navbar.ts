import  * as fs from 'fs';
import * as path from 'path';
import { ipcRenderer } from "electron";



export class NavBar {
    private element: HTMLElement;

    constructor() {
        // Read HTML component
        const navBar = fs.readFileSync(path.join(__dirname, 'navbar.html'), 'utf-8');

        // Parse the HTML to extract the #navBar content
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = navBar;

        const navBarElement = tempContainer.querySelector('#navBar');
        if (!navBarElement) {
            throw new Error("[NavBar Renderer] NavBar element (#navBar) not found in navbar.html");
        }

        const logoElement = navBarElement.querySelector<HTMLImageElement>('#logo');
        if (logoElement) {
            logoElement.src = path.join(__dirname, '../../assets/images/NeuraSenseLogo.png');
        } else {
            console.warn("[NavBar Renderer] Logo element (#logo) not found in navbar.html");
        }

        this.element = navBarElement as HTMLElement;
        
    }

    // Method to append nav bar to a container
    appendTo(container: HTMLElement) {
        container.appendChild(this.element)
        // this.setUpNavigation()
    }
}
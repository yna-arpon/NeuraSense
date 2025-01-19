import { BasePage } from "../../controllers/basePage";

export class RecordingPage extends BasePage {
    constructor() {
        super("recording");
    }

    initialize(): void {
        super.initialize();
        console.log("[RecordingPage] Setting up recording page functionality.");
        // Setup recording page logic here

        const navBarDiv = document.getElementById("navBarDiv");
        if (navBarDiv) {
        navBarDiv.style.display = "none";
        }
    }
}
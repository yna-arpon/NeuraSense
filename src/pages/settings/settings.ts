import { BasePage } from "../../controllers/basePage";

export class SettingsPage extends BasePage {
    constructor() {
        super("recording");
    }

    initialize(): void {
        super.initialize();
        console.log("[SettingsPage] Setting up recording page functionality.");
        // Setup recording page logic here
    }
}
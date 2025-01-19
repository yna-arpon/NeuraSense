import { BasePage } from "../../controllers/basePage";

export class HistoryPage extends BasePage {
    constructor() {
        super("recording");
    }

    initialize(): void {
        super.initialize();
        console.log("[HistoryPage] Setting up recording page functionality.");
        // Setup recording page logic here
    }
}
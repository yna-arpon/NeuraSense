import { HomePage } from "../pages/home/home";
import { RecordingPage } from "../pages/recording/recording";
import { HistoryPage } from "../pages/history/history";
import { SettingsPage } from "../pages/settings/settings";
import { BasePage } from "./basePage";

type PageClass = new () => BasePage;

export class PageManager {
    private pages: { [key: string]: PageClass } = {
        home: HomePage,
        recording: RecordingPage,
        history: HistoryPage,
        settings: SettingsPage
    };

    setupPage(pageName: string): void {
        // Retrieve class associated with the page name
        console.log("[PAGE MANAGER]: Setting up ", pageName)
        const Page = this.pages[pageName];
        
        if (Page) {
            // Create a new instance of the page
            const pageInstance = new Page();

            // Set page functionality
            pageInstance.initialize();
        } else {
            console.error(`Page ${pageName} not found`)
        }
    }
}
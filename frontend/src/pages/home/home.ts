import { ipcRenderer } from "electron";
import { BasePage } from "../../controllers/basePage";

export class HomePage extends BasePage {
    constructor() {
        super("home")
    }

    initialize(): void {
        super.initialize();

        // Select all buttons with the class 'pageBtn'
        const homeNavBtns = document.querySelectorAll<HTMLButtonElement>(".pageBtn");

        // Home page navigation
        homeNavBtns.forEach((btn) => {
            btn.addEventListener(("click"), () => {
                let page
                switch(btn.id) {
                    case "recordingPageBtn":
                        page = "recording";
                        break
                    case "historyPageBtn":
                        page = "history";
                        break
                    case "helpPageBtn":
                        page = "help";
                        break
                    default:
                        console.error("[HOME RENDENER]: Unknown button clicked");
                        break
                }

                ipcRenderer.send("navigate", page)
            })
        })

    }
}
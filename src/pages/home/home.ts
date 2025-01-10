import { ipcRenderer } from "electron";

const homeNavBtns = document.querySelectorAll<HTMLButtonElement>(".pageBtn");

homeNavBtns.forEach((btn) => {
    btn.addEventListener(("click"), () => {
        console.log(`"${btn.id}" was clicked`)

        let page
        switch(btn.id) {
            case "recordingPageBtn":
                console.log("Navigating to recording page");
                page = "recording";
                break
            case "historyPageBtn":
                console.log("Navigating to history page");
                page = "history";
                break
            case "settingsPageBtn":
                console.log("Navigating to settings page");
                page = "settings";
                break
            case "helpPageBtn":
                console.log("Navigating to help page");
                page = "help";
                break
            default:
                console.log("Unknown button clicked")
        }

        ipcRenderer.send("goToPage", page)
    })
})
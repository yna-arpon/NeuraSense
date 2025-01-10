import { ipcRenderer } from "electron";
import { NavBar } from "../../components/navbar";

const homeNavBtns = document.querySelectorAll<HTMLButtonElement>(".pageBtn");
const navBarContainer = document.getElementById("navBar")

// Append navigation bar
const navBar = new NavBar()
navBarContainer && navBar.appendTo(navBarContainer)

// Home page navigation
homeNavBtns.forEach((btn) => {
    btn.addEventListener(("click"), () => {
        console.log(`[Home Renderer] "${btn.id}" was clicked`)

        let page
        switch(btn.id) {
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
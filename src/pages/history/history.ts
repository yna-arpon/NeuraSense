import { NavBar } from "../../components/navbar";

const navBarContainer = document.getElementById("navBarDiv")

// Append navigation bar
const navBar = new NavBar()
navBarContainer && navBar.appendTo(navBarContainer)
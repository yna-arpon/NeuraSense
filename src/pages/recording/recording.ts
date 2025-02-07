import { error } from "console";
import { BasePage } from "../../controllers/basePage";

export class RecordingPage extends BasePage {
    constructor() {
        super("recording");
    }

    initialize(): void {
        super.initialize();
        console.log("[RecordingPage] Setting up recording page functionality.");

        const form = document.getElementById("patientFieldsContainer") as HTMLFormElement;
        const submitBtn = document.getElementById("startRecordingBtn") as HTMLButtonElement;

        // Dynamically add * on required fields
         document.querySelectorAll("input[required]").forEach(input => {
            let label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.innerHTML += ' <span style="color: #742B45;">*</span>';
            }
        });

        // Add event listeners to all required fields
        form.querySelectorAll("input[required]").forEach(input => {
            input.addEventListener("input", () => {
                submitBtn.disabled = !form.checkValidity(); 
            });
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            let isValid = true;
            
            const fields: { inputID: string, errorID: string }[] = [
                { inputID: "fname", errorID: "fnameError"},
                { inputID: "mname", errorID: "mnameError"},
                { inputID: "lname", errorID: "lnameError"}
            ]

            fields.forEach(({ inputID, errorID }) => {
                const input = document.getElementById(inputID) as HTMLInputElement;
                const error = document.getElementById(errorID) as HTMLElement;
                
                if (!this.validateName(input, error)) {
                    isValid = false
                }
            })

            if (!isValid) {
                event.preventDefault(); // Stop form submission
            }  else {
                form.submit();
            } 
        })
    }


    validateName(input: HTMLInputElement, error: HTMLElement): boolean {
        const namePattern = /^[A-Za-z\s\-]+$/;
        
        if (!namePattern.test(input.value) && input.value.trim() !== "") {
            this.invalidStyling(input, error)
            return false;
        } else {
            input.style.border = "";
            error.textContent = "";
            return true;
        }
    }

    invalidStyling(input: HTMLInputElement, error: HTMLElement): void {
        const errorMessage = "Only alphabets, spaces, and hyphens are allowed.";
        error.textContent = errorMessage;
        error.style.display = "block";
        error.style.color = "#ff6687";
        error.style.fontSize = "12px"

        input.style.border = "1px solid rgb(255, 102, 135)";
        input.style.boxShadow = "rgba(155, 102, 135, 0.2) 0px 2px 8px 0px;";
    }
}
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
            
            const nameFields: { inputID: string, errorID: string }[] = [
                { inputID: "fname", errorID: "fnameError"},
                { inputID: "mname", errorID: "mnameError"},
                { inputID: "lname", errorID: "lnameError"}
            ]

            const healthNum: { inputID: string, errorID: string} = { inputID: "healthNum", errorID: "hnumError" };

            const validForm = this.handleSubmission(nameFields, healthNum);

            if (!validForm) {
                event.preventDefault(); // Stop form submission
            }  else {
                form.submit();
            } 
        })
    }

    handleSubmission(nameFields: { inputID: string, errorID: string }[], healthNum: { inputID: string, errorID: string }): boolean {
        let isValid = true;

        const namePattern = /^[A-Za-z\s\-]+$/;
        const healthNumPattern = /^[0-9\s\-]+$/;


        // Check names 
        nameFields.forEach(({ inputID, errorID }) => {
            const nameInput = document.getElementById(inputID) as HTMLInputElement;
            const nameError = document.getElementById(errorID) as HTMLElement;
            
            if (!this.validateInput(nameInput, nameError, namePattern)) {
                isValid = false;
            }
        });

        // Check health number
        const healthNumInput = document.getElementById(healthNum.inputID) as HTMLInputElement;
        const healthNumError = document.getElementById(healthNum.errorID) as HTMLElement;

        if(!this.validateInput(healthNumInput, healthNumError, healthNumPattern)) {
            isValid = false;
        }

        return isValid
    }

    validateInput(input: HTMLInputElement, error: HTMLElement, pattern: RegExp) {
        if (!pattern.test(input.value) && input.value.trim() !== "") {
            // Invalid input
            this.invalidStyling(input, error);
            return false;
        } else {
            // Valid input
            input.style.border = "";
            error.textContent = "";
            return true;
        }   
    }

    // validateName(input: HTMLInputElement, error: HTMLElement): boolean {
    //     const namePattern = /^[A-Za-z\s\-]+$/;
        
    //     if (!namePattern.test(input.value) && input.value.trim() !== "") {
    //         this.invalidStyling(input, error);
    //         return false;
    //     } else {
    //         input.style.border = "";
    //         error.textContent = "";
    //         return true;
    //     }
    // }


    invalidStyling(input: HTMLInputElement, error: HTMLElement): void {
        const errorID = error.getAttribute("id");
        let errorMessage = ""
        
        if (errorID === "hnumError") {
            errorMessage = "Only digits (0-9), spaces, and hypens are allowed."
        } else {
            errorMessage = "Only alphabets, spaces, and hyphens are allowed.";
        }
        
        error.textContent = errorMessage;
        error.style.display = "block";
        error.style.color = "#ff6687";
        error.style.fontSize = "12px"

        input.style.border = "1px solid rgb(255, 102, 135)";
        input.style.boxShadow = "rgba(155, 102, 135, 0.2) 0px 2px 8px 0px;";
    }
}
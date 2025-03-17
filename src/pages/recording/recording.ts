import { error } from "console";
import { BasePage } from "../../controllers/basePage";
import { toASCII } from "punycode";
import { ipcMain, ipcRenderer } from "electron";

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

        // Get today's date
        const today = new Date().toISOString().split('T')[0];
            
        // Set the max attribute of the input field to today's date
        document.getElementById('birthdate')?.setAttribute('max', today);

        // Add event listeners to all required fields to check if they are filled and enable submit btn
        form.querySelectorAll("input[required]").forEach(input => {
            input.addEventListener("input", () => {
                submitBtn.disabled = !form.checkValidity();
            });
        });

        // Event listener to add more information
        const addMoreInfo = document.getElementById('addMoreInfoButton') as HTMLButtonElement;
        const addInfoDiv = document.getElementById('additionalInfoDiv') as HTMLDivElement;

        addMoreInfo?.addEventListener("click", (event) => {
            event.preventDefault(); // Prevents default button behavior

            // Toggle visibility
            if (addInfoDiv.style.display === "none" || addInfoDiv.style.display === "") {
                addMoreInfo.style.display = "none";
                addInfoDiv.style.display = "block";
                addInfoDiv.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                addInfoDiv.style.display = "none";
        }
        })

        // Check values when user clicks submit
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const nameFields: { inputID: string, errorID: string }[] = [
                { inputID: "fname", errorID: "fnameError"},
                { inputID: "mname", errorID: "mnameError"},
                { inputID: "lname", errorID: "lnameError"}
            ]

            const healthNum: { inputID: string, errorID: string} = { inputID: "healthNum", errorID: "hnumError" };

            const additionalInfo: { inputID: string, errorID: string }[] = [
                {inputID: "ecmoReason", errorID: "ecmoReasonError"},
                {inputID: "acuteSituation", errorID: "acuteSituationError"},
                {inputID: "riskFactors", errorID: "riskFactorsError"},
                {inputID: "medications", errorID: "medicationsError"}
            ]

            const validForm = this.handleSubmission(nameFields, healthNum);

            if (!validForm) {
                event.preventDefault(); // Stop form submission
            } else {
                // Get input values
                const fNameInput = document.getElementById(nameFields[0].inputID) as HTMLInputElement;
                const fName = fNameInput.value.trim();

                const mnameInput = document.getElementById(nameFields[1].inputID) as HTMLInputElement;
                const mname = mnameInput ? mnameInput.value.trim() : "";

                const lnameInput = document.getElementById(nameFields[2].inputID) as HTMLInputElement;
                const lname = lnameInput.value.trim();

                const healthNumInput = document.getElementById(healthNum.inputID) as HTMLInputElement;
                const healthNumVal = Number(healthNumInput.value.trim());

                const bdateInput = document.getElementById("birthdate") as HTMLInputElement;
                const bdate = bdateInput.value

                const ecmoReasonInput = document.getElementById(additionalInfo[0].inputID) as HTMLInputElement;
                const ecmoReason = ecmoReasonInput.value.trim();

                const acuteSituationInput = document.getElementById(additionalInfo[1].inputID) as HTMLInputElement;
                const acuteSituation = acuteSituationInput.value.trim();

                const riskFactorsInput = document.getElementById(additionalInfo[2].inputID) as HTMLInputElement;
                const riskFactors = riskFactorsInput.value.trim();

                const medicationsInput = document.getElementById(additionalInfo[3].inputID) as HTMLInputElement;
                const medications = medicationsInput.value.trim();

                const formFields: { name: string, healthNum: number, birthdate: string,
                    ecmoReason: string, acuteSituation: string, riskFactors: string
                } = {
                    name: `${fName} ${mname} ${lname}`,
                    healthNum: healthNumVal,
                    birthdate: bdate, 
                    ecmoReason: ecmoReason,
                    acuteSituation: acuteSituation,
                    riskFactors: riskFactors
                }

                ipcRenderer.send("submitPatientForm", formFields);
            } 
        })
    }

    handleSubmission(nameFields: { inputID: string, errorID: string }[], 
        healthNum: { inputID: string, errorID: string }): boolean {
        
        let isValid = true;

        const namePattern = /^[A-Za-z\s\-]+$/;
        const healthNumPattern = /^[0-9]+$/;

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
        
        return isValid;
    }

    validateInput(input: HTMLInputElement, error: HTMLElement, pattern: RegExp) {
        if (!pattern.test(input.value) && input.value.trim() !== "") {
            // Invalid input
            this.invalidStyling(input, error);
            return false;
        } else {
            // Valid input
            this.validStyling(input, error);
            return true;
        }   
    }

    invalidStyling(input: HTMLInputElement, error: HTMLElement): void {
        const errorID = error.getAttribute("id");
        let errorMessage = ""
        
        if (errorID === "hnumError") {
            errorMessage = "Only digits (0-9) allowed."
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

    validStyling(input: HTMLInputElement, error: HTMLElement): void {
        input.style.border = "";
        error.textContent = "";
    }
}
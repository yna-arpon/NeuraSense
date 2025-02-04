import { BasePage } from "../../controllers/basePage";

export class RecordingPage extends BasePage {
    constructor() {
        super("recording");
    }

    initialize(): void {
        super.initialize();
        console.log("[RecordingPage] Setting up recording page functionality.");
        
        
        document.querySelectorAll("input[required]").forEach(input => {
            // Dynamically add * on required fields
            let label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.innerHTML += ' <span style="color: #742B45;">*</span>';
            }

            // Check if input fields are valid 
            const form = document.getElementById("patientFieldsContainer") as HTMLFormElement;
            const submitBtn = document.getElementById("startRecordingBtn") as HTMLButtonElement;

            function checkFormValidity() {
                submitBtn.disabled = !form.checkValidity();
            }   
            
            input.addEventListener("input", checkFormValidity);

            // Initial check
            checkFormValidity();
        });
    }
}
import Database from "better-sqlite3"

// Initialize Database
const db = new Database('ecmo.db')

export class DatabaseManager {
    constructor() {
        this.createTables();
    }

    // Create tables
    createTables() {
        db.exec(`
            CREATE TABLE IF NOT EXISTS Patient (
              healthNumber INTEGER PRIMARY KEY,
              patientName TEXT NOT NULL,
              birthdate DATE NOT NULL
            );
          
            CREATE TABLE IF NOT EXISTS Recording (
              recordingID INTEGER PRIMARY KEY AUTOINCREMENT,
              patientHealthNumber INTEGER NOT NULL,
              ecmoStart DATETIME NOT NULL,
              ecmoEnd DATETIME NOT NULL,
              eegFile BLOB,
              fNIRSFile BLOB,
              FOREIGN KEY(patientHealthNumber) REFERENCES Patient(healthNumber)
            );
          `);
    }

    // Generate sample data for testing 
    insertSampleData() {
        const insertPatient = db.prepare(`
          INSERT OR IGNORE INTO Patient (healthNumber, patientName, birthdate) VALUES (?, ?, ?)
        `);
      
        const insertRecording = db.prepare(`
          INSERT INTO Recording (patientHealthNumber, ecmoStart, ecmoEnd, eegFile, fNIRSFile) 
          VALUES (?, ?, ?, NULL, NULL)
        `);
      
        // Add Patients
        insertPatient.run(1234, 'John Doe', '2015-06-15');
        insertPatient.run(5678, 'Jane Smith', '2012-11-25');
      
        // Add Recordings
        insertRecording.run(1234, '2023-01-01 10:00:00', '2023-01-15 12:00:00');
        insertRecording.run(5678, '2023-01-16 14:30:00', '2023-02-27 16:30:00');
      
        console.log('Sample data inserted.');
    }

    // Get data 
    getData(): {
        healthNumber: number;
        patientName: string;
        birthdate: Date;
        recordingID: number;
        ecmoStart: Date;
        ecmoEnd: Date;
        eegFile: string | null;
        fNIRSFile: string | null;
    }[] {
        const stmt = db.prepare(`
            SELECT 
              Patient.healthNumber, 
              Patient.patientName, 
              Patient.birthdate,
              Recording.recordingID,
              Recording.ecmoStart,
              Recording.ecmoEnd,
              Recording.eegFile,
              Recording.fNIRSFile
            FROM Patient
            LEFT JOIN Recording ON Patient.healthNumber = Recording.patientHealthNumber
        `);
    
        // Map the raw data to the desired format
        const rawData = stmt.all();
        return rawData.map((row: any) => ({
            healthNumber: row.healthNumber,
            patientName: row.patientName,
            birthdate: new Date(row.birthdate),
            recordingID: row.recordingID,
            ecmoStart: new Date(row.ecmoStart),
            ecmoEnd: new Date(row.ecmoEnd),
            eegFile: row.eegFile ? Buffer.from(row.eegFile).toString('base64') : null, // Convert BLOB to Base64
            fNIRSFile: row.fNIRSFile ? Buffer.from(row.fNIRSFile).toString('base64') : null, // Convert BLOB to Base64
        }));
    }

    clearDatabase(): void {
        try {
          // Clear data from tables
          db.prepare('DELETE FROM Recording').run();
          db.prepare('DELETE FROM Patient').run();

          // Reset autoincrement values
          db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('Recording');
          db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('Patient');

          console.log('Database cleared successfully.');
      } catch (error) {
          console.error('Failed to clear database:', error);
      }
    }
}
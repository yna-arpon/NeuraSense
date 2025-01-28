// import Database from "better-sqlite3"

// // Initialize Database
// const db = new Database('ecmo.db')

// // Create tables
// db.exec(`
//     CREATE TABLE IF NOT EXISTS Patient (
//       healthNumber INTEGER PRIMARY KEY,
//       patientName TEXT NOT NULL,
//       birthdate DATE NOT NULL
//     );
  
//     CREATE TABLE IF NOT EXISTS Recording (
//       recordingID INTEGER PRIMARY KEY AUTOINCREMENT,
//       patientHealthNumber INTEGER NOT NULL,
//       ecmoStart DATETIME NOT NULL,
//       ecmoEnd DATETIME NOT NULL,
//       eegFile BLOB,
//       fNIRSFile BLOB,
//       FOREIGN KEY(patientHealthNumber) REFERENCES Patient(healthNumber)
//     );
//   `);

//   export default db
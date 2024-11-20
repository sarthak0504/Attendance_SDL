const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const fileUpload = require('express-fileupload');  // Import express-fileupload

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());


console.log('hello');
let uploadedFilePath = ''; 

// Endpoint to upload the document
app.post('/upload_document', (req, res) => {
    console.log('POST /upload_document called'); 
    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }

    const document = req.files.document;
    uploadedFilePath = path.join(__dirname, 'uploads', document.name);

    console.log("Uploaded File Path:", uploadedFilePath); 
    // Ensure the uploads directory exists
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
        console.log('Uploads directory created.'); 
    }

    // Save the uploaded file
    document.mv(uploadedFilePath, (err) => {
        if (err) {
            console.error('Error moving file:', err); // Log any errors moving the file
            return res.status(500).send(err);
        }

        res.send({ message: 'File uploaded successfully!', filePath: uploadedFilePath });
    });
});

// Endpoint to get student data
// app.get('/get_students', (req, res) => {
//     if (!uploadedFilePath) {
//         console.log('No file uploaded.'); // Log if no file uploaded
//         return res.status(400).send('No file uploaded. Please upload a file.');
//     }

//     // Check if the uploaded file exists
//     if (!fs.existsSync(uploadedFilePath)) {
//         console.log(`Uploaded file does not exist at path: ${uploadedFilePath}`);
//         return res.status(400).send('Uploaded file does not exist.');
//     }

//     try {
//         const workbook = XLSX.readFile(uploadedFilePath);
//         const attendanceSheet = workbook.Sheets['Attendance'];
//         const contactsSheet = workbook.Sheets['Contacts'];

//         // Log to verify if sheets are being read correctly
//         const attendanceData = XLSX.utils.sheet_to_json(attendanceSheet);
//         const contactsData = XLSX.utils.sheet_to_json(contactsSheet);
        
//         // console.log("Attendance Data.by me:", attendanceData);
//         // console.log("Contacts Data by me:", contactsData);
//         console.log('me');

//         const mergedData = attendanceData.map(attendance => {
//             const contact = contactsData.find(contact => contact.Enrollement === attendance.Enrollement);
//             return {
//                 Name: attendance.Name,
//                 Enrollement: attendance.Enrollement,
//                 Percentage: attendance['Total Percentage'], // Adjust this based on your actual field name
//                 Contact: contact ? contact.Contact : ''
//             };
//         });

//         // Log the merged data to see if it's constructed correctly
//         // console.log("Merged Data:", mergedData);

//         const studentsBelow75 = mergedData.filter(student => {
//             const percentageFloat = parseFloat(student.Percentage);
//             return !isNaN(percentageFloat) && percentageFloat < 75;
//         });

//         console.log("Students Below 75%:", studentsBelow75);  // Log final data
//         res.json(studentsBelow75);

//     } catch (error) {
//         console.error('Error reading the uploaded file:', error);
//         res.status(500).send('Error reading the uploaded file.');
//     }
// });

app.get('/get_students', (req, res) => {
    if (!uploadedFilePath) {
        console.log('No file uploaded.'); // Log if no file uploaded
        return res.status(400).send('No file uploaded. Please upload a file.');
    }

    // Check if the uploaded file exists
    if (!fs.existsSync(uploadedFilePath)) {
        console.log(`Uploaded file does not exist at path: ${uploadedFilePath}`);
        return res.status(400).send('Uploaded file does not exist.');
    }

    try {
        const workbook = XLSX.readFile(uploadedFilePath);
        const attendanceSheet = workbook.Sheets['Attendance'];
        const contactsSheet = workbook.Sheets['Contacts'];

        // Fetch data as objects based on header names
        const attendanceData = XLSX.utils.sheet_to_json(attendanceSheet, { defval: null }); // Get data as objects
        const contactsData = XLSX.utils.sheet_to_json(contactsSheet, { defval: null }); // Get data as objects

        // Log to verify if sheets are being read correctly
        console.log("Attendance Data:", attendanceData);
        // console.log("Contacts Data:", contactsData);

//         const headers = XLSX.utils.sheet_to_json(attendanceSheet, { header: 4 })[4]; // Gets the first row as headers
// console.log("Headers in Attendance Sheet:", headers);


        const mergedData = attendanceData.map(attendance => {
            const contact = contactsData.find(contact => 
                contact.Enrollement && attendance.Enrollement && 
                contact.Enrollement.toLowerCase() === attendance.Enrollement.toLowerCase()
            );
            // const contact = contactsData.find(contact => contact.Enrollement === attendance.Enrollement);
            return {
                Name: attendance.Name || 'N/A', // Assuming 'Name' is the column header
                Enrollement: attendance.Enrollement || 'N/A', // Assuming 'Enrollement' is the column header
                Percentage: attendance['Total Percentage'] || 'N/A', // Adjust based on your actual field name
                Contact: contact ? contact.Contact : 'N/A' // Assuming 'Contact' is the column header
            };
        });

        // Log the merged data to see if it's constructed correctly
        // console.log("Merged Data:", mergedData);

        const studentsBelow75 = mergedData.filter(student => {
            const percentageFloat = parseFloat(student.Percentage);
            return !isNaN(percentageFloat) && percentageFloat < 75;
        });

        console.log("Students Below 75%:", studentsBelow75);  // Log final data
        res.json(studentsBelow75);

    } catch (error) {
        console.error('Error reading the uploaded file:', error);
        res.status(500).send('Error reading the uploaded file.');
    }
});

// Endpoint to send audio messages via Python script
app.post('/send_messages', (req, res) => {
    const { enrollments } = req.body;

    if (!uploadedFilePath) {
        console.log('No file uploaded for sending messages.'); // Log if no file uploaded
        return res.status(400).send('No file uploaded.');
    }

    // Adjust path for Python if necessary
    // const pythonScriptPath = path.join(__dirname, 'Message_audio.py');
    const pythonScriptPath = path.join(__dirname, 'Message_audio.py');
    const command = `python ${pythonScriptPath} ${uploadedFilePath}`; 

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return res.status(500).send('Failed to send audio messages.');
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
            return res.status(500).send('Failed to send audio messages.');
        }
        console.log(`Python script stdout: ${stdout}`);
        res.send({ message: 'Audio messages sent successfully!' });
    });
});

// Endpoint to send SMS messages via Python script
app.post('/send_sms_messages', (req, res) => {
    if (!uploadedFilePath) {
        console.log('No file uploaded for sending SMS.'); // Log if no file uploaded
        return res.status(400).send('No file uploaded.');
    }

    // Adjust path for Python if necessary
    const pythonScriptPath = path.join(__dirname, 'test.py');
    const command = `python ${pythonScriptPath} ${uploadedFilePath}`; 

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return res.status(500).send('Failed to send SMS messages.');
        }
        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
            return res.status(500).send('Failed to send SMS messages.');
        }
        console.log(`Python script stdout: ${stdout}`);
        res.send({ message: 'SMS messages sent successfully!' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

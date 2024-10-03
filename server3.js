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
app.use(fileUpload()); // Use express-fileupload middleware

let uploadedFilePath = ''; // Global variable to track the uploaded file path

// Endpoint to upload the document
app.post('/upload_document', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const document = req.files.document;
    uploadedFilePath = path.join(__dirname, 'uploads', document.name); // Save the file to 'uploads' directory

    // Ensure the uploads directory exists
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
    }

    // Save the uploaded file
    document.mv(uploadedFilePath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        res.send({ message: 'File uploaded successfully!', filePath: uploadedFilePath });
    });
});

// Endpoint to get student data
app.get('/get_students', (req, res) => {
    if (!uploadedFilePath) {
        return res.status(400).send('No file uploaded. Please upload a file.');
    }

    try {
        const workbook = XLSX.readFile(uploadedFilePath);
        const attendanceSheet = workbook.Sheets['Attendance'];
        const contactsSheet = workbook.Sheets['Contacts'];

        const attendanceData = XLSX.utils.sheet_to_json(attendanceSheet);
        const contactsData = XLSX.utils.sheet_to_json(contactsSheet);

        const mergedData = attendanceData.map(attendance => {
            const contact = contactsData.find(contact => contact.Enrollement === attendance.Enrollement);
            return {
                Name: attendance.Name,
                Enrollement: attendance.Enrollement,
                Percentage: attendance['Total Percentage'],
                Contact: contact ? contact.Contact : ''
            };
        });

        const studentsBelow75 = mergedData.filter(student => student.Percentage < 75);
        res.json(studentsBelow75);

    } catch (error) {
        console.error('Error reading the uploaded file:', error);
        res.status(500).send('Error reading the uploaded file.');
    }
});

// Other endpoints (send audio messages, send SMS, etc.) remain unchanged...

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

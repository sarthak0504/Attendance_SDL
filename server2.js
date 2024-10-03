const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const fileUpload = require('express-fileupload'); // For handling file uploads

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload()); // Middleware to handle file uploads

const uploadedFilePath = path.join(__dirname, 'uploads'); // Directory for uploaded files

// Ensure the uploads directory exists
if (!fs.existsSync(uploadedFilePath)) {
    fs.mkdirSync(uploadedFilePath);
}

// Endpoint to get student data
app.get('/get_students', (req, res) => {
    const filePath = path.join(__dirname, 'students_data2.xlsx');

    const workbook = XLSX.readFile(filePath);
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
});

// Endpoint to send audio messages
app.post('/send_messages', (req, res) => {
    const { enrollments } = req.body;
    const tempFilePath = path.join(__dirname, 'temp_enrollments.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(enrollments), 'utf8');

    const scriptPath = path.join(__dirname, 'Message_audio.py');
    exec(`python ${scriptPath} ${tempFilePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ status: 'error', message: 'Failed to send messages' });
        }
        console.log(`stdout: ${stdout}`);
        fs.unlinkSync(tempFilePath);
        res.json({ status: 'success' });
    });
});

// Endpoint to send SMS messages
app.post('/send_sms_messages', (req, res) => {
    const { enrollments } = req.body;
    const tempFilePath = path.join(__dirname, 'temp_enrollments.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(enrollments), 'utf8');

    const scriptPath = path.join(__dirname, 'message.py');
    exec(`python ${scriptPath} ${tempFilePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ status: 'error', message: 'Failed to send SMS messages' });
        }
        console.log(`stdout: ${stdout}`);
        fs.unlinkSync(tempFilePath);
        res.json({ status: 'success' });
    });
});

// Endpoint to handle document upload
app.post('/upload_document', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const document = req.files.document;
    const filePath = path.join(uploadedFilePath, document.name);

    // Check if a file already exists in the directory, and delete the old one
    fs.readdir(uploadedFilePath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading uploaded files' });
        }
        if (files.length > 0) {
            // Delete the existing file
            const existingFilePath = path.join(uploadedFilePath, files[0]);
            fs.unlinkSync(existingFilePath);
        }

        // Save the new file
        document.mv(filePath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to upload document' });
            }
            res.json({ message: 'File uploaded successfully', filePath });
        });
    });
});

// Endpoint to get the uploaded document
app.get('/get_uploaded_document', (req, res) => {
    fs.readdir(uploadedFilePath, (err, files) => {
        if (err || files.length === 0) {
            return res.status(404).json({ message: 'No document uploaded' });
        }
        res.json({ documentName: files[0] });
    });
});

// Endpoint to delete the uploaded document
app.delete('/delete_document', (req, res) => {
    fs.readdir(uploadedFilePath, (err, files) => {
        if (err || files.length === 0) {
            return res.status(404).json({ message: 'No document to delete' });
        }

        const filePath = path.join(uploadedFilePath, files[0]);
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to delete document' });
            }
            res.json({ message: 'Document deleted successfully' });
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

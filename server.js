const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

    const scriptPath = path.join(__dirname, 'Audio.py');
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
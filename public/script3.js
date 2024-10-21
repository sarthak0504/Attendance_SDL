document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#studentTable tbody');

    // Function to fetch and display student data
    function fetchAndDisplayStudents() {
        fetch('http://localhost:3000/get_students')
        .then(response => {
            if (!response.ok) {
                throw new Error('Please upload the document to fetch the details. If not showing any option then check your network connection');
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // Check the structure and content
            if (data.length === 0) {
                console.log('No students below 75% found.');
                tableBody.innerHTML = '<tr><td colspan="3">No students found with attendance below 75%</td></tr>';
                return;
            }

            // Clear the table before appending new data
            tableBody.innerHTML = '';

            // Populate the table with student data
            data.forEach(student => {
                const row = document.createElement('tr');

                // Inspect the actual value of 'Percentage'
                // console.log(student.Percentage);
                // console.log(student.Enrollement);

                // Convert and handle percentage value
                const percentageFloat = parseFloat(student.Percentage);
                const percent = !isNaN(percentageFloat) ? Math.round(percentageFloat) : 'N/A';

                row.innerHTML = `
                    <td>${student.Enrollement}</td>
                    <td>${student.Name}</td>
                    <td>${percent}%</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load student data. Please try again later. Error: ' + error.message);
        });
    }

    // Fetch student data on page load
    fetchAndDisplayStudents();

    // Event listener for the Send Audio Messages button
    document.getElementById('sendButton').addEventListener('click', function() {
        const enrollments = Array.from(document.querySelectorAll('#studentTable tbody tr'))
            .map(row => row.children[0].textContent); // Adjusted to get the Enrollment value from the first column

        fetch('http://localhost:3000/send_messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enrollments })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send audio messages');
            }
            return response.json();
        })
        .then(data => alert('Audio messages sent successfully!'))
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send audio messages. Please try again later. Error: ' + error.message);
        });
    });

    // Event listener for the Send SMS Messages button
    document.getElementById('sendSmsButton').addEventListener('click', function() {
        const enrollments = Array.from(document.querySelectorAll('#studentTable tbody tr'))
            .map(row => row.children[0].textContent); // Adjusted to get the Enrollment value from the first column

        fetch('http://localhost:3000/send_sms_messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enrollments })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send SMS messages');
            }
            return response.json();
        })
        .then(data => alert('SMS messages sent successfully!'))
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send SMS messages. Please try again later. Error: ' + error.message);
        });
    });

    // Event listener for the document upload
    document.getElementById('uploadButton').addEventListener('click', function() {
        const fileInput = document.getElementById('documentInput');
        const formData = new FormData();

        if (fileInput.files.length > 0) {
            formData.append('document', fileInput.files[0]);

            fetch('http://localhost:3000/upload_document', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload document');
                }
                return response.json();
            })
            .then(data => {
                alert('Document uploaded successfully!');
                // Fetch and display the updated student data
                fetchAndDisplayStudents();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to upload document. Please try again later. Error: ' + error.message);
            });
        } else {
            alert('Please select a document to upload.');
        }
    });
    //     const fileInput = document.getElementById('documentInput');
    //     const formData = new FormData();

    //     if (fileInput.files.length > 0) {
    //         formData.append('document', fileInput.files[0]);

    //         fetch('http://localhost:3000/upload_document', {
    //             method: 'POST',
    //             body: formData
    //         })
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error('Failed to upload document');
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             alert('Document uploaded successfully!');
    //             // Fetch and display the updated student data
    //             fetchAndDisplayStudents();
    //         })
    //         .catch(error => {
    //             console.error('Error:', error);
    //             alert('Failed to upload document. Please try again later. Error: ' + error.message);
    //         });
    //     } else {
    //         alert('Please select a document to upload.');
    //     }
    // });
});

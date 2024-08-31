document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#studentTable tbody');

    // Fetch student data from the backend
    fetch('http://localhost:3000/get_students')
    .then(response => response.json())
    .then(data => {
        console.log(data); // Check the structure and content
        // Populate the table with student data
        data.forEach(student => {
            const row = document.createElement('tr');
            
            // Inspect the actual value of 'Percentage'
            console.log(student.Percentage);
            
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
        alert('Failed to load student data. Please try again later.');
    });

    // Event listener for the Send Audio Messages button
    document.getElementById('sendButton').addEventListener('click', function() {
        const enrollments = Array.from(document.querySelectorAll('#studentTable tbody tr'))
            .map(row => row.children[1].textContent);

        fetch('http://localhost:3000/send_messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enrollments })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send messages');
            }
            return response.json();
        })
        .then(data => alert('Messages sent successfully!'))
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send messages. Please try again later.');
        });
    });

    // Event listener for the Send SMS Messages button
    document.getElementById('sendSmsButton').addEventListener('click', function() {
        const enrollments = Array.from(document.querySelectorAll('#studentTable tbody tr'))
            .map(row => row.children[1].textContent);

        fetch('http://localhost:3000/send_sms', {
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
            alert('Failed to send SMS messages. Please try again later.');
        });
    });
});

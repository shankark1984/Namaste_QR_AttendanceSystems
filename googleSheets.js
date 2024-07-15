// googleSheets.js

// Function to fetch data from Google Sheets based on empCode
export async function fetchDataFromGoogleSheet(empCode) {
    const API_KEY = 'AIzaSyDKPxKSID_Vq7TVXexqbvlbzjffSKkBsDA';
    const SHEET_ID = '1CzaJwL1YLvKqBVn2l2wLIxAUKO1U0jYMIpo5_RgYC-E';
    const RANGE = 'Attendance!A:F'; // Adjust the range as per your sheet

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Find row with matching empCode
        const rowData = data.values.find(row => row[1] === empCode); // Assuming empCode is in the second column (index 1)

        if (rowData) {
            return {
                empCode: rowData[1],
                empName: rowData[2],
                siteID: rowData[3],
                workOrderNo: rowData[4],
                datetime: rowData[5],
                currentLatitude: rowData[6],
                currentLongitude: rowData[7]
                // Add more fields as needed
            };
        } else {
            return null; // Return null if empCode not found
        }
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        throw error; // Throw error to handle in calling function
    }
}

// Function to populate HTML table with data
export function populateTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing table body content

    if (data) {
        // Create a table row for the data
        const tr = document.createElement('tr');

        // Iterate over each data field and create table cells
        Object.values(data).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });

        // Append the table row to the table body
        tableBody.appendChild(tr);
    } else {
        // If data is null (empCode not found), show a message in the table
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7; // Span across all columns
        td.textContent = 'Employee data not found.';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}

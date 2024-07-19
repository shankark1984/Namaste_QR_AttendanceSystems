const MAX_DISTANCE_KM = 0.1; // Approximately 100 meters
const SCAN_DELAY = 1000;
let empCode = null;

// Utility function to format date and time
const formatDateTime = date => {
    const pad = num => String(num).padStart(2, "0");
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// DOM Ready function
const domReady = fn => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, SCAN_DELAY);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
};

// Function to handle QR code scan success
const onScanSuccess = async (decodeText, decodeResult) => {
    const splits = decodeText.split(",");
    console.log(splits);
    if (splits[0] === "Site") {
        if (!empCode) {
            alert("Please scan employee card first.");
            return;
        }
        getLocation();
        document.getElementById("siteCodeDisplay").textContent = `Site Code: ${splits[1]}`;
        document.getElementById("siteID").value = splits[1];
        document.getElementById("workOrderNo").value = splits[2];
        document.getElementById("siteLatitude").value = splits[3];
        document.getElementById("siteLongitude").value = splits[4];

        document.getElementById("siteLatitude").textContent = splits[3];
        document.getElementById("siteLongitude").textContent = splits[4];

        // Debugging: Log site coordinates
        console.log("Site Latitude:", splits[3]);
        console.log("Site Longitude:", splits[4]);

    } else if (splits[0] === "Emp") {
        empCode = splits[1];
        const empExists = await searchEmpCodeMatch(empCode);

        if (!empExists) {
            return; // Stop execution if employee doesn't exist or is deactive
        }
        await searchEmpCode(empCode);
        
        document.getElementById("empCode").value = splits[1];
        document.getElementById("empName").value = splits[2];
        
        const empNameDisplayElement = document.getElementById("empNameDisplay");
        if (empNameDisplayElement) {
            empNameDisplayElement.textContent = `Emp Name: ${splits[2]}`;
        }
        document.getElementById("datetime").value = formatDateTime(new Date());

        // Debugging: Log employee code and name
        console.log("Emp Code:", splits[1]);
        console.log("Emp Name:", splits[2]);

    
        // Fetch and display data in table
        
    }
}

// Initialize QR code scanner
domReady(() => {
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbos: 250 });
    htmlscanner.render(onScanSuccess);
});

// Function to get current location
const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true, // Request high accuracy mode
            timeout: 5000, // Set timeout to 5 seconds
            maximumAge: 0 // Disable caching of location
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Function to show current position
const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Debugging: Log current position
    console.log("Current Position Latitude:", latitude);
    console.log("Current Position Longitude:", longitude);

    if (!isValidLocation(latitude, longitude)) {
        alert("Your current location is not within the allowed range. Please enable high accuracy mode on your device.");
        return;
    }

    document.getElementById("currentLatitude").value = latitude;
    document.getElementById("currentLongitude").value = longitude;
};

// Function to check if location is within the allowed range (100 meters)
const isValidLocation = (latitude, longitude) => {
    const centerLatitude = parseFloat(document.getElementById("siteLatitude").textContent);
    const centerLongitude = parseFloat(document.getElementById("siteLongitude").textContent);

    // Debugging: Log center position
    console.log("Center Position Latitude:", centerLatitude);
    console.log("Center Position Longitude:", centerLongitude);

    const distance = calculateDistance(latitude, longitude, centerLatitude, centerLongitude);

    // Debugging: Log calculated distance
    console.log("Calculated Distance:", distance);

    return distance <= MAX_DISTANCE_KM;
};

// Function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Function to convert degrees to radians
const toRadians = degrees => degrees * (Math.PI / 180);

// Function to handle geolocation errors
const showError = error => {
    const errorMessages = {
        1: "User denied the request for Geolocation.",
        2: "Location information is unavailable.",
        3: "The request to get user location timed out.",
        0: "An unknown error occurred."
    };
    alert(errorMessages[error.code]);
};

// Google Sheets API Fetch Function
const API_KEY = 'AIzaSyDKPxKSID_Vq7TVXexqbvlbzjffSKkBsDA'; // Replace with your API key
const SHEET_ID = '1CzaJwL1YLvKqBVn2l2wLIxAUKO1U0jYMIpo5_RgYC-E'; // Replace with your Google Sheet ID
const RANGE = 'Attendance!A1:F'; // Adjust the range as per your sheet
const empRange='EmployeeDetails!A1:C';

async function fetchData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    console.log("Fetching data from URL:", url); // Debugging output
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debugging output
        return data.values;
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data from Google Sheets. Please check console for more details.");
    }
}

async function matchedEmpfetchData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${empRange}?key=${API_KEY}`;
    console.log("Fetching data from URL:", url); // Debugging output
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debugging output
        return data.values;
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data from Google Sheets. Please check console for more details.");
    }
}

function populateTable(data) {
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (data && data.length > 0) {
        // Populate table header
        const headers = ['Date', 'In Time', 'Out Time', 'Working Hours'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            tableHeader.appendChild(th);
        });

        // Populate table body with processed data
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4; // Only 4 columns
        td.textContent = 'No data available';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}

function processInOutTimes(data) {
    const dateMap = new Map();

    data.forEach(row => {
        const [timestamp, empCode, empName, datetime, siteID, workOrderNo] = row;
        const [date, time] = datetime.split(' ');

        if (!dateMap.has(date)) {
            dateMap.set(date, []);
        }

        dateMap.get(date).push({ time, row });
    });

    const processedData = [];

    dateMap.forEach(entries => {
        if (entries.length >= 2) {
            // Sort by time for the given date
            const sortedEntries = entries.sort((a, b) => new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`));
            const inTime = sortedEntries[0].time;
            const outTime = sortedEntries[sortedEntries.length - 1].time;

            const inDateTime = new Date(`1970-01-01T${inTime}`);
            const outDateTime = new Date(`1970-01-01T${outTime}`);
            const diffMs = outDateTime - inDateTime; // Difference in milliseconds
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`; // Format "Hours:Minutes"

            const newRow = [sortedEntries[0].row[3].split(' ')[0], inTime, outTime, workingHours];
            processedData.push(newRow);
        } else {
            const newRow = [entries[0].row[3].split(' ')[0], entries[0].time, '', ''];
            processedData.push(newRow);
        }
    });

    return processedData;
}

async function searchEmpCode(empCode) {
    const data = await fetchData();
    if (data && data.length > 0) {
        // Assuming empCode is in the first column
        const filteredData = data.filter(row => row[1] === empCode);
        // Include the header row (if you still need it for any purpose, otherwise skip this)
        // filteredData.unshift(data[0]);  // Commented out because we do not need header for the table
        const processedData = processInOutTimes(filteredData);
        populateTable(processedData);
    }
}

async function searchEmpCodeMatch(empCode) {
    const data = await matchedEmpfetchData();
    if (data && data.length > 0) {
        // Assuming empCode is in the first column and status is in the third column
        const matchData = data.filter(row => row[0] === empCode);
        
        if (matchData.length > 0) {
            const status = matchData[0][2];
            if (status === "Active") {
                console.log('Employee A', matchData);
                return true; // Employee exists and is active
            } else {
                alert("Your Employee Id is blocked, kindly contact your admin");
                location.reload(); // Refresh the page
                return false; // Employee exists but is deactive
            }
        } else {
            alert("Employee doesn't exist, kindly contact your admin");
            location.reload(); // Refresh the page
            return false; // Employee doesn't exist
        }
    } else {
        alert("No data available");
        return false; // No data available
    }
}
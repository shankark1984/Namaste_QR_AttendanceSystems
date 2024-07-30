// Constants
const MAX_DISTANCE_KM = 10; // Approximately 100 meters
const SCAN_DELAY = 1000;
const API_KEY = 'AIzaSyDKPxKSID_Vq7TVXexqbvlbzjffSKkBsDA';
const SHEET_ID = '1CzaJwL1YLvKqBVn2l2wLIxAUKO1U0jYMIpo5_RgYC-E';
const RANGE = 'Attendance!A1:I';
const empRange = 'EmployeeDetails!A1:C';

let empCode = null;
let latestLogStatus = null; // Added to store the latest log status

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
    console.log("Decoded QR code data:", splits);

    if (splits[0] === "Site") {
        if (!empCode) {
            alert("Please scan employee card first.");
            return;
        }
        getLocation();
        document.getElementById("siteCodeDisplay").textContent = `Site Code: ${splits[1]}`;
        document.getElementById("siteID").value = splits[1];
        document.getElementById("workOrderNo").value = splits[2];
        document.getElementById("insiteLatitude").value = splits[3];
        document.getElementById("insiteLongitude").value = splits[4];
        document.getElementById("outsiteLatitude").value = splits[3];
        document.getElementById("outsiteLongitude").value = splits[4];
        console.log("Site Coordinates - Latitude:", splits[3], "Longitude:", splits[4]);

    } else if (splits[0] === "Emp") {
        empCode = splits[1];
        const empExists = await searchEmpCodeMatch(empCode);
        if (!empExists) {
            return;
        }
        await searchEmpCode(empCode, async (filteredData) => {
            await updateButtonStates(empCode);
        });

        document.getElementById("empCode").value = splits[1];
        document.getElementById("empName").value = splits[2];

        const empNameDisplayElement = document.getElementById("empNameDisplay");
        if (empNameDisplayElement) {
            empNameDisplayElement.textContent = `Emp Name: ${splits[2]}`;
        }
        document.getElementById("indatetime").value = formatDateTime(new Date());
        document.getElementById("outdatetime").value = formatDateTime(new Date());
        console.log("Employee Code:", splits[1], "Employee Name:", splits[2]);
    }
};

// Initialize QR code scanner
domReady(() => {
    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbox: 250 });
    htmlscanner.render(onScanSuccess);
});

// Function to get current location
const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Function to show current position
const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log("Current Position - Latitude:", latitude, "Longitude:", longitude);

    if (!isValidLocation(latitude, longitude)) {
        alert("Your current location is not within the allowed range. Please enable high accuracy mode on your device.");
        return;
    }

    document.getElementById("incurrentLatitude").value = latitude;
    document.getElementById("incurrentLongitude").value = longitude;
    document.getElementById("outcurrentLatitude").value = latitude;
    document.getElementById("outcurrentLongitude").value = longitude;
};

// Function to check if location is within the allowed range
const isValidLocation = (latitude, longitude) => {
    const centerLatitude = parseFloat(document.getElementById("insiteLatitude").value);
    const centerLongitude = parseFloat(document.getElementById("insiteLongitude").value);

    if (isNaN(centerLatitude) || isNaN(centerLongitude)) {
        return true; // If center coordinates are not provided, always return true
    }

    const distance = calculateDistance(centerLatitude, centerLongitude, latitude, longitude);
    console.log("Distance from site coordinates:", distance, "km");
    return distance <= MAX_DISTANCE_KM;
};

// Function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = degrees => degrees * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Function to show error message
const showError = error => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
};

// Function to fetch data from Google Sheets
const fetchDataFromGoogleSheets = async range => {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`);
        if (!response.ok) {
            throw new Error("Failed to fetch data from Google Sheets");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

// Function to search employee code
const searchEmpCodeMatch = async empCode => {
    const data = await fetchDataFromGoogleSheets(empRange);
    if (!data) {
        alert("Failed to fetch data from Google Sheets");
        return false;
    }

    const employeeData = data.values || [];
    const empRow = employeeData.find(row => row[0] === empCode);

    if (!empRow) {
        alert(`Employee with EmpCode ${empCode} not found.`);
        document.getElementById("empCode").value = '';
        document.getElementById("empName").value = '';
        document.getElementById("empNameDisplay").textContent = "Scan Employee Code";
        return false;
    }

    document.getElementById("empName").value = empRow[1];
    document.getElementById("empNameDisplay").textContent = `Emp Name: ${empRow[1]}`;

    return true;
};

const updateButtonStates = async empCode => {
    const data = await fetchDataFromGoogleSheets(RANGE);
    if (!data) {
        alert("Failed to fetch data from Google Sheets");
        return;
    }

    const attendanceData = data.values || [];
    console.log("Attendance Data:", attendanceData); // Debugging: Log raw data

    // Filter the data by employee code and date
    const today = formatDate(new Date());
    const filteredData = attendanceData.filter(row => row[0] === empCode && row[7] === today);
    console.log("Filtered Data:", filteredData); // Debugging: Log filtered data

    if (filteredData.length > 0) {
        const lastLogStatus = filteredData[filteredData.length - 1][8]; // Adjust index if needed
        console.log("Last Log Status:", lastLogStatus); // Debugging: Log last log status

        latestLogStatus = lastLogStatus; // Update the latest log status

        // Update button states based on the latest log status
        if (latestLogStatus === "IN") {
            document.getElementById("login").disabled = true;
            document.getElementById("logout").disabled = false;
        } else if (latestLogStatus === "INOUT") {
            document.getElementById("login").disabled = false;
            document.getElementById("logout").disabled = true;
        } else {
            document.getElementById("login").disabled = false;
            document.getElementById("logout").disabled = false;
        }
    } else {
        // If no data found for the employee, enable both buttons
        document.getElementById("login").disabled = false;
        document.getElementById("logout").disabled = false;
    }
};


// Function to search employee code and update log status
const searchEmpCode = async (empCode, callback) => {
    const data = await fetchDataFromGoogleSheets(RANGE);
    if (!data) {
        alert("Failed to fetch data from Google Sheets");
        return;
    }

    const attendanceData = data.values || [];
    console.log("Fetched Data:", attendanceData); // Debugging statement

    // Ensure the employee code is correctly compared (trimmed and case-insensitive)
    empCode = empCode.trim();
    console.log("Searching for empCode:", empCode);

    // Filter the data by employee code with exact match
    const filteredData = attendanceData.filter(row => row[2].trim() === empCode); // Adjust column index as needed
    console.log("Filtered Data for empCode:", filteredData); // Debugging statement

    if (filteredData.length === 0) {
        console.log("No logs found for empCode.");
        document.getElementById("logStatus").value = 'IN'; // Default status if no logs found
        return;
    }

    // Function to parse date and time into a Date object
    const parseDateTime = dateTimeStr => {
        const [date, time] = dateTimeStr.split(' ');
        const [day, month, year] = date.split('/').map(Number);
        const [hour, minute, second] = time.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
    };

    // Sort filtered data by date and time to find the latest entry
    const sortedData = filteredData.sort((a, b) => {
        const dateTimeA = parseDateTime(a[0] + ' ' + a[1]); // Combine date and time
        const dateTimeB = parseDateTime(b[0] + ' ' + b[1]); // Combine date and time
        return dateTimeB - dateTimeA; // Sort in descending order
    });

    const latestLog = sortedData[0]; // Get the latest log entry
    console.log("Sorted Data:", sortedData); // Debugging statement
    console.log("Latest Entry for empCode:", latestLog); // Print the latest entry in the console

    // Extract and print the latest log status
    const latestLogStatus = latestLog ? latestLog[8] : 'IN'; // Adjust index as needed
    console.log("Latest Log Status for empCode:", latestLogStatus); // Print the latest log status

    // Determine the log status based on the latest entry
    const logStatus = latestLogStatus === 'IN' ? 'INOUT' : (latestLogStatus === 'INOUT' ? 'IN' : latestLogStatus);

    // Update the logStatus input field
    document.getElementById("logStatus").value = logStatus;

    if (callback) {
        callback(filteredData);
    }

    // Update button states based on latest log status
    await updateButtonStates(empCode);
};


// Function to post data to Google Sheets
const postDataToGoogleSheets = async (values) => {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}:append?valueInputOption=RAW&insertDataOption=INSERT_DATA_OPTION_OVERWRITE&key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: RANGE,
                majorDimension: 'ROWS',
                values: [values]
            })
        });

        if (!response.ok) {
            throw new Error("Failed to post data to Google Sheets");
        }

        console.log("Data posted to Google Sheets successfully.");
    } catch (error) {
        console.error(error);
    }
};

const handleLoginClick = async () => {
    if (latestLogStatus === "IN") {
        alert("Already logged in.");
        return;
    }

    const logStatus = 'IN';
    const empCode = document.getElementById("empCode").value;
    const dateTime = formatDateTime(new Date());

    const values = [empCode, '', '', '', '', '', formatDate(new Date()), logStatus, dateTime];
    await postDataToGoogleSheets(values);

    // Update button states
    await updateButtonStates(empCode);
};


const handleLogoutClick = async () => {
    if (latestLogStatus === "OUT") {
        alert("Already logged out.");
        return;
    }

    const logStatus = 'OUT';
    const empCode = document.getElementById("empCode").value;
    const dateTime = formatDateTime(new Date());

    const values = [empCode, '', '', '', '', '', formatDate(new Date()), logStatus, dateTime];
    await postDataToGoogleSheets(values);

    // Update button states
    await updateButtonStates(empCode);
};


// Attach event listeners to buttons
document.getElementById("login").addEventListener("click", handleLoginClick);
document.getElementById("logout").addEventListener("click", handleLogoutClick);

// Format the date
const formatDate = date => date.toISOString().split('T')[0];

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

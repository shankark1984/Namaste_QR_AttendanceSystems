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

        document.getElementById("datetime").value = formatDateTime(new Date());

        // Set logStatus dynamically based on searchLogStatus result
        const logStatus = await searchLogStatus(empCode);
        console.log("logStatus:", logStatus); // Debug log
        document.getElementById("logStatus").value = logStatus;
        document.getElementById("logStatus1").textContent = "LOG" + logStatus;

        document.getElementById("dataAttendance").textContent = `Current Month Attendance Details`;
        // Fetch and display data in table
        await searchEmpCode(empCode);
        
        
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
            timeout: 50000, // Set timeout to 5 seconds
            maximumAge: 0 // Disable caching of location
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Function to show current position
const showPosition = position => {
    // const latitude = 12.8892684;
    // const longitude = 77.63991;

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Debugging: Log current position
    console.log("Current Position Latitude:", latitude);
    console.log("Current Position Longitude:", longitude);

    if (!isValidLocation(latitude, longitude)) {
        alert("Your current location is not within the allowed range. Please enable high accuracy mode on your device.");
        document.getElementById("siteCodeDisplay").style.display='none';
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
const RANGE = 'Attendance!A1:H'; // Adjust the range as per your sheet
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

    // Organize data by date and status
    data.forEach(row => {
        const [timestamp, empCode, empName, datetime, siteID, workOrderNo, logStatus] = row;
        const [date, time] = datetime.split(' ');

        if (!dateMap.has(date)) {
            dateMap.set(date, { inTimes: [], outTimes: [] });
        }

        if (logStatus.toUpperCase() === 'IN') {
            dateMap.get(date).inTimes.push({ time, row });
        } else if (logStatus.toUpperCase() === 'OUT') {
            dateMap.get(date).outTimes.push({ time, row });
        } else {
            // If logStatus is empty, consider it as an additional entry without status
            dateMap.get(date).inTimes.push({ time, row });
        }
    });

    const processedData = [];

    // Process data for each date
    dateMap.forEach(({ inTimes, outTimes }, date) => {
        // Sort by time for each status
        const sortedInTimes = inTimes.sort((a, b) => new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`));
        const sortedOutTimes = outTimes.sort((a, b) => new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`));

        // Match In and Out times
        while (sortedInTimes.length && sortedOutTimes.length) {
            const inEntry = sortedInTimes.shift();
            const outEntry = sortedOutTimes.shift();

            // Calculate working hours
            const inDateTime = new Date(`1970-01-01T${inEntry.time}`);
            const outDateTime = new Date(`1970-01-01T${outEntry.time}`);
            const diffMs = outDateTime - inDateTime;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`;

            processedData.push([date, inEntry.time, outEntry.time, workingHours]);
        }

        // Handle cases with extra inTimes or outTimes
        sortedInTimes.forEach(inEntry => {
            processedData.push([date, inEntry.time, '', '']);
        });

        sortedOutTimes.forEach(outEntry => {
            processedData.push([date, '', outEntry.time, '']);
        });
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
    const filteredData = data.filter(row => row[0] === empCode);

    console.log("Filtered data for employee code match:", filteredData); // Debugging output

    if (filteredData.length === 0) {
        alert("Employee does not exist in the database. Please contact the administrator.");
        console.log("Employee code not found in the database:", empCode); // Debugging output
        return false; // Return false if employee code is not found
    }

    const isDeactive = filteredData[0][2] === 'Deactive';
    if (isDeactive) {
        alert("Employee is currently deactive. Please contact the administrator.");
        console.log("Employee code is deactive:", empCode); // Debugging output
        return false; // Return false if employee code is deactive
    }

    return true; // Return true if employee exists and is active
}

async function searchLogStatus(empCode) {
    const data = await fetchData();

    // Filter data for the specific employee
    const filteredData = data
        .filter(row => row[1] === empCode)
        .sort((a, b) => {
            // Combine date and time into a single Date object
            const aDateTime = new Date(`${a[0]} ${a[3]}`);
            const bDateTime = new Date(`${b[0]} ${b[3]}`);
            return bDateTime - aDateTime; // Sort in descending order
        });

    console.log("Filtered data for log status:", filteredData); // Debugging output

    if (filteredData.length === 0) {
        console.log("No log data found for empCode:", empCode); // Debugging output
        return 'IN'; // Default to 'IN' if no log data found
    }

    // Get the most recent log entry (last entry in sorted array)
    const latestLogEntry = filteredData[filteredData.length - 1];
    console.log("Latest log entry for empCode:", empCode, latestLogEntry); // Debugging output

    // Determine the latest log status
    const latestLogStatus = (latestLogEntry[6] || '').trim().toUpperCase();
    console.log("Latest log status for empCode:", empCode, "is:", latestLogStatus); // Debugging output

    // Toggle between 'IN' and 'OUT' based on the latest log status
    if (latestLogStatus === 'IN') {
        return 'OUT';
    } else {
        return 'IN';
    }
}

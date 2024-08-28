// Constants
const MAX_DISTANCE_KM = 1; // Approximately 100 meters
const SCAN_DELAY = 500000;
const API_KEY = 'AIzaSyDKPxKSID_Vq7TVXexqbvlbzjffSKkBsDA';
const SHEET_ID = '1CzaJwL1YLvKqBVn2l2wLIxAUKO1U0jYMIpo5_RgYC-E';
const RANGE = 'Attendance!A1:I';
const empRange = 'EmployeeDetails!A1:C';

const loginButton = document.getElementById('login');
const logoutButton = document.getElementById('logout');

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

        const siteCoordinates = {
            siteCode: splits[1],
            workOrderNo: splits[2],
            siteLatitude: parseFloat(splits[3]),
            siteLongitude: parseFloat(splits[4])
        };

        getLocation(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            if (!isValidLocation(latitude, longitude, siteCoordinates.siteLatitude, siteCoordinates.siteLongitude)) {
                logoutButton.disabled = true;
                loginButton.disabled = true;
                alert("Your current location is not within the allowed range. Please enable high accuracy mode on your device.");
                return;
            }

            document.getElementById("siteCodeDisplay").textContent = `Site Code: ${siteCoordinates.siteCode}`;
            document.getElementById("siteID").value = siteCoordinates.siteCode;
            document.getElementById("workOrderNo").value = siteCoordinates.workOrderNo;
            document.getElementById("insiteLatitude").value = siteCoordinates.siteLatitude;
            document.getElementById("insiteLongitude").value = siteCoordinates.siteLongitude;
            document.getElementById("outsiteLatitude").value = siteCoordinates.siteLatitude;
            document.getElementById("outsiteLongitude").value = siteCoordinates.siteLongitude;
            console.log("Site Coordinates - Latitude:", siteCoordinates.siteLatitude, "Longitude:", siteCoordinates.siteLongitude);


            console.log("Latest Log Status:", latestLogStatus); // Debugging

            setTimeout(() => {
                if (!latestLogStatus || latestLogStatus === ' ') {
                    console.log("Entering the first condition (login enabled, logout disabled).");
                    loginButton.disabled = false;
                    logoutButton.disabled = true;
                } else if (latestLogStatus === "IN") {
                    console.log("Entering the second condition (login disabled, logout enabled).");
                    logoutButton.disabled = false;
                    loginButton.disabled = true;
                } else if (latestLogStatus === "INOUT") {
                    console.log("Entering the third condition (login enabled, logout disabled).");
                    logoutButton.disabled = true;
                    loginButton.disabled = false;
                } else {
                    console.log("No matching condition found for latestLogStatus.");
                }
            }, 5000); // 5 seconds delay
        });
    }
    if (splits[0] === "Emp") {
        empCode = splits[1];
        const empExists = await searchEmpCodeMatch(empCode);
        if (!empExists) {
            return;
        }
        await searchEmpCode(empCode, async (filteredData) => {
            populateTable(filteredData); // Populate table with filtered data
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
        loginButton.disabled = true;
        logoutButton.disabled = true;
    }
};

// Initialize QR code scanner
domReady(() => {
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbox: 250 });
    htmlscanner.render(onScanSuccess);
});

// Function to get current location
const getLocation = (callback) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(callback, showError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Function to check if location is within the allowed range
const isValidLocation = (latitude, longitude, siteLatitude, siteLongitude) => {
    const distance = calculateDistance(siteLatitude, siteLongitude, latitude, longitude);
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
        console.error("Error" + error);
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
    console.log(empRow +" " + empCode);
    document.getElementById("empName").value = empRow[1];
    document.getElementById("empNameDisplay").textContent = `Emp Name: ${empRow[1]}`;

    return true;
};

// Function to fetch and process attendance data
const fetchAttendanceData = async empCode => {
    const data = await fetchDataFromGoogleSheets(RANGE);
    if (!data) {
        alert("Failed to fetch data from Google Sheets");
        return [];
    }

    const attendanceData = data.values || [];
    const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const filteredData = attendanceData.filter(row => {
        const rowDate = row[0].split(' ')[0];
        const rowEmpCode = row[2];
        return rowDate === todayDate && rowEmpCode === empCode;
    });

    console.log("Filtered Data:", filteredData);

    if (filteredData.length === 0) {
        document.getElementById("logStatus").value = 'IN';
    }

    return filteredData;
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

    empCode = empCode.trim();
    console.log("Searching for empCode:", empCode);

    // Filter the data by employee code with exact match
    const filteredData = attendanceData.filter(row => row[2] === empCode); // Adjust column index as needed
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
    latestLogStatus = latestLog ? latestLog[8] : 'IN'; // Adjust index as needed
    console.log("Latest Log Status for empCode:", latestLogStatus); // Print the latest log status

    // Determine the log status based on the latest entry
    const logStatus = latestLogStatus === 'IN' ? 'INOUT' : (latestLogStatus === 'INOUT' ? 'IN' : latestLogStatus);
    console.log("Find latest Log Status ok: " + latestLogStatus);
    // Update the logStatus input field
    document.getElementById("logStatus").value = logStatus;


    if (callback) {
        callback(filteredData);
    }
};

const populateTable = (data) => {
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    // Define table headers correctly
    tableHeader.innerHTML = `
        <th>In Date</th>
        <th>In Time</th>
        <th>Out Date</th>
        <th>Out Time</th>
        <th>Working Hours</th>
        <th>Total Working Hours for the Day</th>
    `;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    const currentMonth = new Date().getMonth(); // Get the current month (0-11)
    const currentYear = new Date().getFullYear(); // Get the current year

    const dateWorkingHoursMap = {};

    // Filter data for the current month
    const filteredData = data.filter(row => {
        const [inDate, inTime] = (row[4] || '').split(' ');
        const [day, month, year] = inDate.split('-').map(Number);

        return (month - 1) === currentMonth && year === currentYear;
    });

    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available for the current month</td></tr>';
        return;
    }

    filteredData.forEach(row => {
        const [inDate, inTime] = (row[4] || '').split(' ');
        const [outDate, outTime] = (row[5] || '').split(' ');

        // Calculate working hours
        const workingHours = calculateWorkingHours(inDate, inTime, outDate, outTime);

        // Aggregate working hours for each date
        if (inDate) {
            if (!dateWorkingHoursMap[inDate]) {
                dateWorkingHoursMap[inDate] = {
                    totalWorkingHours: 0,
                    rows: []
                };
            }
            dateWorkingHoursMap[inDate].totalWorkingHours += parseHours(workingHours);
            dateWorkingHoursMap[inDate].rows.push({ inDate, inTime, outDate, outTime, workingHours });
        }
    });

    // Clear previous rows before adding new rows
    tableBody.innerHTML = '';

    for (const inDate in dateWorkingHoursMap) {
        const { totalWorkingHours, rows } = dateWorkingHoursMap[inDate];
        rows.forEach((row, index) => {
            const tr = document.createElement('tr');

            // Create table cells
            const cells = [
                row.inDate || '-',   // In Date
                row.inTime || '-',   // In Time
                row.outDate || '-',  // Out Date
                row.outTime || '-',  // Out Time
                row.workingHours || '-',  // Working Hours
                index === 0 ? formatHours(totalWorkingHours) : '' // Total Working Hours for the day
            ];

            cells.forEach((cell, cellIndex) => {
                const td = document.createElement('td');
                td.textContent = cell;

                // Apply rowspan for the Total Working Hours cell
                if (cellIndex === 5 && index === 0) {
                    td.setAttribute('rowspan', rows.length);
                } else if (cellIndex === 5 && index > 0) {
                    // Hide cells in rows with rowspan
                    td.style.display = 'none';
                }

                // Append cell to row
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });
    }
};

// Function to calculate working hours between in and out times
const calculateWorkingHours = (inDate, inTime, outDate, outTime) => {
    if (!inDate || !inTime || !outDate || !outTime) {
        return '-'; // Return '-' if any of the date/time values are missing
    }

    const inDateTime = new Date(`${inDate.split('-').reverse().join('-')}T${inTime}`);
    const outDateTime = new Date(`${outDate.split('-').reverse().join('-')}T${outTime}`);

    if (isNaN(inDateTime) || isNaN(outDateTime) || inDateTime > outDateTime) {
        return '-'; // Return '-' if date/time is invalid or inDateTime is after outDateTime
    }

    const diffMs = outDateTime - inDateTime;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format as "HH:MM"
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Function to parse hours from "Hours:Minutes" format
const parseHours = (workingHours) => {
    if (workingHours === '-' || !workingHours) return 0;
    const [hours, minutes] = workingHours.split(':').map(Number);
    return hours * 60 + minutes;
};

// Function to format total hours in "Hours:Minutes" format
const formatHours = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};
// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            // Check for updates
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available
                                console.log('New update available');
                                if (confirm('New update available. Do you want to update now?')) {
                                    installingWorker.postMessage({ action: 'skipWaiting' });
                                }
                            } else {
                                // Content is cached for offline use
                                console.log('Content is cached for offline use.');
                            }
                        }
                    };
                }
            };
        }).catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });

    // Listen for the 'controllerchange' event to reload the page when the new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

// Optionally handle 'skipWaiting' message in service worker
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

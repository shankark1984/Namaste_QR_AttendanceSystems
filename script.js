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
const onScanSuccess = (decodeText, decodeResult) => {
    const splits = decodeText.split(",");

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
        document.getElementById("empCode").value = splits[1];
        document.getElementById("empName").value = splits[2];

        empCode = splits[1];
        document.getElementById("empNameDisplay").textContent = `Emp Name: ${splits[2]}`;
        document.getElementById("datetime").value = formatDateTime(new Date());

        // Debugging: Log employee code and name
        console.log("Emp Code:", splits[1]);
        console.log("Emp Name:", splits[2]);
    }
};

// Initialize QR code scanner
domReady(() => {
    const htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbos: 250 });
    htmlscanner.render(onScanSuccess);
});

// Function to get current location
const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
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
        alert("Your current location is not within the allowed range.");
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

var empCode = null;

function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(function () {

    // Function to handle QR code scan success
    function onScanSuccess(decodeText, decodeResult) {
        var mystring = decodeText;
        var splits = mystring.split(",");

        if (splits[0] === "Site") {
            console.log(mystring);
            if (empCode == null) {
                alert("Please scan employee card first.");
                return;
            }
            document.getElementById("siteID").value = splits[1];
            document.getElementById("workOrderNo").value = splits[2];
        }

        if (splits[0] === "Emp") {
            document.getElementById("empCode").value = splits[1];
            document.getElementById("empName").value = splits[2];

            empCode = splits[1]; // Store empCode for future use

            // Display empCode above camera view
            document.getElementById("empCodeDisplay").textContent = "Emp Code: " + splits[1];

            // Get current date and time
            let currentDateTime = new Date();
            let day = String(currentDateTime.getDate()).padStart(2, '0');
            let month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
            let year = currentDateTime.getFullYear();
            let hours = String(currentDateTime.getHours()).padStart(2, '0');
            let minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
            let formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

            getLocation(); // Fetch location when QR code is successfully scanned
            document.getElementById("datetime").value = formattedDateTime;
        }
    }

    // Initialize QR code scanner
    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbos: 250 }
    );
    htmlscanner.render(onScanSuccess);
});

// Function to get current location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to show current position
function showPosition(position) {
    document.getElementById("srtLatitude").value = position.coords.latitude;
    document.getElementById("srtLongitude").value = position.coords.longitude;
}

// Function to handle geolocation errors
function showError(error) {
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
}

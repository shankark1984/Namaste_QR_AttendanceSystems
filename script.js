var empCode = null;
var notRange = null;

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
			getLocation(); // Fetch location when QR code is successfully scanned
			document.getElementById("siteCodeDisplay").textContent = "Site Code: " + splits[1];
			document.getElementById("siteID").value = splits[1];
			document.getElementById("workOrderNo").value = splits[2];
			document.getElementById("siteLatitude").value = splits[3];
			document.getElementById("siteLongitude").value = splits[4];

			document.getElementById("siteLatitude").textContent = splits[3];
			document.getElementById("siteLongitude").textContent = splits[4];

		}

		if (splits[0] === "Emp") {
			document.getElementById("empCode").value = splits[1];
			document.getElementById("empName").value = splits[2];

			empCode = splits[1]; // Store empCode for future use

			// Display empCode above camera view
			document.getElementById("empNameDisplay").textContent = "Emp Name: " + splits[2];

			// Get current date and time
			let currentDateTime = new Date();
			let day = String(currentDateTime.getDate()).padStart(2, '0');
			let month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
			let year = currentDateTime.getFullYear();
			let hours = String(currentDateTime.getHours()).padStart(2, '0');
			let minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
			let formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

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
const x = document.getElementById("demo");
function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	} else {
		alert("Geolocation is not supported by this browser.");
	}
}

// Function to show current position
function showPosition(position) {
	// Validate if location is within 100 meters range
	if (!isValidLocation(position.coords.latitude, position.coords.longitude)) {
		//notRange="outofRange";
		alert("Your current location is not within the allowed range.");
		return;

	}

	document.getElementById("currentLatitude").value = position.coords.latitude;
	document.getElementById("currentLongitude").value = position.coords.longitude;
}

// Function to check if location is within the allowed range (100 meters)
function isValidLocation(latitude, longitude) {
	var centerLatitude = parseFloat(document.getElementById("siteLatitude").textContent);
	var centerLongitude = parseFloat(document.getElementById("siteLongitude").textContent);
	var maxDistance = 0.1; // Approximately 100 meters in degrees

	// Calculate distance using Haversine formula
	var distance = calculateDistance(latitude, longitude, centerLatitude, centerLongitude);

	// Debugging output
	console.log("Center:", centerLatitude, centerLongitude);
	console.log("Current:", latitude, longitude);
	console.log("Distance:", distance);

	// Check if distance is within the allowed range
	if (distance <= maxDistance) {
		console.log("Within range");
		return true;
	} else {
		console.log("Not within range");
		return false;
	}
}

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the Earth in km
	var dLat = toRadians(lat2 - lat1);
	var dLon = toRadians(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

// Function to convert degrees to radians
function toRadians(degrees) {
	return degrees * (Math.PI / 180);
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

var empCode = null;



// script.js file

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

	// If found you qr code
	function onScanSuccess(decodeText, decodeResult) {
		//alert("You Qr is : " + decodeText, decodeResult);
		var mystring = decodeText;
		var splits = mystring.split(",");

		if (splits[0] === "Site") {
			console.log(mystring);
			if (empCode == null) {
				alert("First scan employee card");
				return;
			}
			document.getElementById("siteID").value = splits[1];
			document.getElementById("workOrderNo").value = splits[2];
			//alert("Your QR is: " + decodeText + "\nScanned at: " + formattedDateTime);

			// Load data into Google Sheets 

		}
		if (splits[0] === "Emp") {

						document.getElementById("empCode").value = splits[1];
						document.getElementById("empName").value = splits[2];

						empCode = splits[1];

						// Get current date and time
						let currentDateTime = new Date();
						let day = String(currentDateTime.getDate()).padStart(2, '0');
						let month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
						let year = currentDateTime.getFullYear();
						let hours = String(currentDateTime.getHours()).padStart(2, '0');
						let minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
						let formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

						getLocation(); // Call getLocation function when QR code is successfully scanned
						document.getElementById("datetime").value = formattedDateTime;

						//alert("Your QR is: " + decodeText + "\nScanned at: " + formattedDateTime);
		}
	}

	let htmlscanner = new Html5QrcodeScanner(
		"my-qr-reader",
		{ fps: 10, qrbos: 250 }
	);
	htmlscanner.render(onScanSuccess);
});

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(showPosition);
	} else {
		alert("Geolocation is not supported by this browser.");
	}
}

function showPosition(position) {
	document.getElementById("srtLatitude").value = position.coords.latitude;
	document.getElementById("srtLongitude").value = position.coords.longitude;
}

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
			document.getElementById("siteID").textContent = splits[1];
			document.getElementById("workOrderNo").textContent = splits[2];

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

						alert("Your QR is: " + decodeText + "\nScanned at: " + formattedDateTime);
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





// function checkEmpIDInGoogleSheets(empID) {
	
// 	return gapi.client.sheets.spreadsheets.values.get({
// 		spreadsheetId: '1yd0gKUawMM4s2x_zkVtS-JiSTPxTk1FHGVsyzvMBSyM',
// 		range: 'EmpDetails!A2:B', // Adjust the range as needed
// 	}).then(response => {
		
// 		const rows = response.result.values;
// 		if (rows && rows.length > 0) {
// 			for (const row of rows) {
// 				if (row[0] === empID) {
// 					return { empName: row[1] };
// 				}
// 			}
// 		}
// 		return null;
// 	}).catch(error => {
// 		console.error('Error fetching data from Google Sheets:', error);
// 		throw error;
// 	});
// }



// function initClient() {
//     console.log("Initializing Google API client...");
//     gapi.load('auth2', function () {
//         gapi.auth2.init({
//             client_id: '505868231978-igpj87dp3evo0nhamj5tr07lbh0igr5t.apps.googleusercontent.com',
//             scope: 'https://www.googleapis.com/auth/spreadsheets', // Example scope for Google Sheets
//         }).then(function (auth2) {
//             console.log('Google API client initialized successfully.');
//             // Proceed with further application initialization or rendering
//         }).catch(function (error) {
//             console.error('Error initializing Google API client:', error);
//             alert("Error initializing Google API client. Check console for details.");
//         });
//     });
// }

// function loadGoogleApi() {
// 	console.log("Loading Google API client...");
// 	gapi.load('client:auth2', initClient);
// }

// // Ensure DOM is ready before executing code
// domReady(loadGoogleApi);

// function loadTableDataIntoGoogleSheets() {
// 	// Collect the table data
// 	const tableData = [
// 		document.getElementById("empID").textContent,
// 		document.getElementById("empName").textContent,
// 		document.getElementById("siteID").textContent,
// 		document.getElementById("workOrderNo").textContent,
// 		document.getElementById("datetime").textContent,
// 		document.getElementById("srtLatitude").textContent,
// 		document.getElementById("srtLongitude").textContent,
// 	];

// 	// Load the data into Google Sheets (adjust the range and spreadsheet ID as needed)
// 	gapi.client.sheets.spreadsheets.values.append({
// 		spreadsheetId: '1yd0gKUawMM4s2x_zkVtS-JiSTPxTk1FHGVsyzvMBSyM',
// 		range: 'Attendance!A2', // Adjust the range as needed
// 		valueInputOption: 'RAW',
// 		resource: {
// 			values: [tableData],
// 		},
// 	}).then(response => {
// 		console.log('Data loaded into Google Sheets:', response);
// 	}).catch(error => {
// 		console.error('Error loading data into Google Sheets:', error);
// 	});
// }

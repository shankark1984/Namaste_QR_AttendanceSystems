function updateInputBoxes() {
	var select = document.getElementById('typeSelect');
	var selectedValue = select.value;
	var inputContainer = document.getElementById('inputContainer');
	inputContainer.innerHTML = ''; // Clear existing input boxes

	if (selectedValue === 'Emp') {
		inputContainer.innerHTML = `
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Employee ID" oninput="generateQr()" />
            </div>
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Employee Name" oninput="generateQr()" />
            </div>
        `;
	} else if (selectedValue === 'Site') {
		inputContainer.innerHTML = `
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Site Name" oninput="generateQr()" />
            </div>
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Work Order Number" oninput="generateQr()" />
            </div>
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Site Latitude" oninput="generateQr()" />
            </div>
            <div class="input-container">
                <input type="text" class="qrInput" placeholder="Site Longitude" oninput="generateQr()" />
            </div>
        `;
	} else {
		// For no selection or other values
		inputContainer.innerHTML = '';
	}
}

function generateQr() {
	var select = document.getElementById('typeSelect');
	var selectedValue = select.value;
	var inputs = document.querySelectorAll('.qrInput');
	var qrData = selectedValue ? selectedValue + ',' : '';

	// Collect values from input boxes
	inputs.forEach(input => {
		if (input.value.trim() !== '') {
			qrData += input.value.trim() + ',';
		}
	});

	qrData = qrData.trim();
	var qrCodeContainer = document.getElementById('qrcode');

	// Clear any previous QR code
	qrCodeContainer.innerHTML = '';

	if (qrData !== '') {
		// Generate a QR code with a display size of 192x192
		new QRCode(qrCodeContainer, {
			text: qrData,
			width: 192,  // Display size
			height: 192, // Display size
			correctLevel: QRCode.CorrectLevel.H,
		});
	}
}
function downloadQrCode() {
    var select = document.getElementById('typeSelect');
    var selectedValue = select.value;
    var inputs = document.querySelectorAll('.qrInput');
    var qrData = selectedValue ? selectedValue + ',' : '';

    // Collect values from input boxes
    var labels = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') {
            qrData += input.value.trim() + ',';
            labels.push(input.placeholder);
        }
    });

    qrData = qrData.trim();

    if (qrData === '') {
        alert("Please enter values in all input boxes to generate a QR code first!"); // Alert if input is empty
        return;
    }

    // Create a temporary canvas to hold the QR code and the input text
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var qrCodeContainer = document.createElement('div');

    // Set canvas dimensions for a 600x700 background
    canvas.width = 600;
    canvas.height = 750;

    // Fill the canvas with a white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Generate a QR code with a size of 512x512
    new QRCode(qrCodeContainer, {
        text: qrData,
        width: 512,  // QR code size
        height: 512, // QR code size
        correctLevel: QRCode.CorrectLevel.H,
    });

    // Wait for QR code to render
    setTimeout(() => {
        var qrCodeImg = qrCodeContainer.querySelector('img');
        if (qrCodeImg) {
            // Calculate the position to center the QR code
            var qrX = (canvas.width - 512) / 2; // Center horizontally
            var qrY = (canvas.height - 512) / 2; // Center vertically

            // Draw the QR code image on the canvas
            context.drawImage(qrCodeImg, qrX, qrY, 512, 512);

            // Logo settings
            var logo = new Image();
            logo.src = 'img/logo.png'; // Path to your logo image
            logo.onload = function () {
                var logoHeight = 100; // Desired height of the logo
                var logoWidth = (logo.width / logo.height) * logoHeight; // Calculate width to maintain aspect ratio
                var logoX = (canvas.width - logoWidth) / 2; // Center the logo horizontally
                var logoY = qrY - logoHeight - 10; // Position the logo above the QR code with a 10px margin

                // Draw the logo on the canvas
                context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

                // Set the font style for the text
                context.font = '24px Arial';
                context.textAlign = 'center';
                context.fillStyle = 'black';

                // Draw the input text below the QR code
                var textY = qrY + 512 + 30; // Position the text below the QR code
                labels.forEach((label, index) => {
                    context.fillText(label + ': ' + inputs[index].value.trim(), canvas.width / 2, textY + (index * 30));
                });

                // Create a link to download the image as JPG
                var link = document.createElement('a');
                link.download = 'qrcode_with_logo.jpg'; // Filename for the downloaded image
                link.href = canvas.toDataURL('image/jpeg'); // Convert canvas to image data URL (JPG format)
                document.body.appendChild(link); // Append to body to make it work in Firefox
                link.click(); // Programmatically click the link to trigger download
                document.body.removeChild(link); // Remove the link from the document
            };
        } else {
            console.error("QR code image not found.");
        }
    }, 100); // Wait for 100ms before capturing
}


function toggleMenu() {
	var navLinks = document.getElementById("navLinks");
	navLinks.style.display = (navLinks.style.display === "block") ? "none" : "block";
}

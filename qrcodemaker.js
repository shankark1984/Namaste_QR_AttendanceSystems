// Create a new QRCode instance
let qrcode = new QRCode(document.querySelector(".qrcode"), {
    width: 1000,
    height: 1000,
});

// Initial QR code generation with a default message
qrcode.makeCode("Why did you scan me?");

// Function to generate QR code based on user input
function generateQr() {
    const inputField = document.querySelector("input");
    const input = inputField.value.trim();

    if (input === "") {
        alert("Input Field cannot be blank!");
    } else {
        qrcode.makeCode(input);
    }
}

// Function to download the QR code as a PNG file
function downloadQr() {
    const qrcodeDiv = document.querySelector(".qrcode");
    const canvas = qrcodeDiv.querySelector("canvas");

    if (canvas) {
        // Create a link element
        const link = document.createElement('a');
        link.href = canvas.toDataURL("image/png");
        link.download = 'qrcode.png';

        // Trigger the download
        link.click();
    } else {
        alert("Please generate a QR code first.");
    }
}

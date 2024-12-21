let slotAction = '';
let airportEmails = {}; // Store emails loaded from JSON
const logData = [];

// Load email data from JSON file
async function loadEmailData() {
    try {
        const response = await fetch('assets/emails.json');
        airportEmails = await response.json();
        console.log('Email data loaded:', airportEmails); // Debug loaded data
    } catch (error) {
        console.error('Error loading email data:', error);
        alert('Failed to load email data. Please check your JSON file.');
    }
}

// Handle login functionality
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (username === "root" && password === "root") {
        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        document.body.style.backgroundColor = '#f4f4f9';
    } else {
        errorMessage.style.display = 'block';
    }
}

// Create and show the form based on action
function createForm(action) {
    slotAction = action.toUpperCase();
    const formSection = document.getElementById('form-section');
    document.getElementById('form-title').textContent = `${action} Form`;
    formSection.style.display = 'block';
}

// Validate seats input length
function validateSeats(input) {
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3);
    }
}

// Generate day value for SCR message
function getDayValue(date) {
    const dayValues = {
        'Sunday': '0000007',
        'Monday': '1000000',
        'Tuesday': '0200000',
        'Wednesday': '0030000',
        'Thursday': '0004000',
        'Friday': '0000500',
        'Saturday': '0000060'
    };
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    return dayValues[dayName];
}

// Generate SCR message
function showSCR() {
    const slotType = document.getElementById('slotType').value;
    const airportCode = document.getElementById('airportCode').value.toUpperCase();
    const flightNumber = document.getElementById('flightNumber').value;
    const dateInput = document.getElementById('date').value;
    const numberOfSeats = document.getElementById('numberOfSeats').value.padStart(3, '0');
    const aircraftType = document.getElementById('aircraftType').value.toUpperCase();
    const time = document.getElementById('time').value.padStart(4, '0');
    const destinationOrigin = document.getElementById('destinationOrigin').value.toUpperCase();
    const serviceType = document.getElementById('serviceType').value;

    if (!airportCode || !flightNumber || !dateInput || !numberOfSeats || !aircraftType || !time || !destinationOrigin) {
        alert("Please fill in all fields.");
        return;
    }

    const date = new Date(dateInput);
    const dayValue = getDayValue(date);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[date.getMonth()];
    const formattedDate = `${day}${month}`;

    let scrTypeIndicator = slotAction === "CANCEL SLOT" ? "D" : slotAction === "NEW SLOT" ? "N" : "C";

    let scrMessage = `
SCR  
W24  
${formattedDate}  
${airportCode}  
`;

    if (slotType === "ARRIVAL") {
        scrMessage += `${scrTypeIndicator}${flightNumber} ${formattedDate}${formattedDate} ${dayValue} ${numberOfSeats}${aircraftType} ${destinationOrigin}${time} ${serviceType}  
SI ${slotAction} REQ ${airportCode}`;
    } else if (slotType === "DEPARTURE") {
        scrMessage += `${scrTypeIndicator} ${flightNumber} ${formattedDate}${formattedDate} ${dayValue} ${numberOfSeats}${aircraftType} ${time}${destinationOrigin} ${serviceType}  
SI ${slotAction} REQ ${airportCode}`;
    }

    const scrMessageDiv = document.getElementById('scrMessage');
    scrMessageDiv.textContent = scrMessage.trim();
    scrMessageDiv.style.display = 'block';

    logData.push({
        slotAction,
        scrMessage: scrMessage.trim()
    });
}

// Show logs in table format
function showLog() {
    const logContainer = document.getElementById('logContainer');
    const logTableBody = document.querySelector("#logTable tbody");
    logTableBody.innerHTML = ""; // Clear previous logs
    logData.forEach(log => {
        const row = logTableBody.insertRow();
        const cellAction = row.insertCell(0);
        const cellMessage = row.insertCell(1);
        cellAction.textContent = log.slotAction;
        cellMessage.textContent = log.scrMessage;
    });
    logContainer.style.display = logData.length > 0 ? "block" : "none";

    if (logData.length > 0) {
        logContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Email SCR message
function emailSCR() {
    const scrMessage = document.getElementById('scrMessage').textContent;
    const airportCode = document.getElementById("airportCode").value.toUpperCase();
    const email = airportEmails[airportCode];
    const ccEmail = "slotdesk@ryanair.com"; // Permanent CC email

    if (!scrMessage) {
        alert("No SCR message to email. Generate it first.");
        return;
    }

    if (!email) {
        alert(`No email found for airport code: ${airportCode}`);
        return;
    }

    const subject = encodeURIComponent(`${slotAction} REQ ${airportCode}`);
    const body = encodeURIComponent(scrMessage);
    const mailtoLink = `mailto:${email}?cc=${ccEmail}&subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
}

// Download logs as CSV
function downloadCSV() {
    if (logData.length === 0) {
        alert("No log data available to download.");
        return;
    }

    const csvContent = [
        ["Slot Action", "SCR Message"], // Headers
        ...logData.map(log => [log.slotAction, log.scrMessage.replace(/\n/g, " ")]) // Escape newlines
    ]
        .map(row => row.map(field => `"${field}"`).join(",")) // Quote fields
        .join("\n"); // Join rows

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "scr_log.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Load email data when the page loads
window.onload = loadEmailData;

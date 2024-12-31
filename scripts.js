// scripts.js

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIefgXMjzsXYbZ6yCVYBqxON84OH3BthI",
    authDomain: "airportsearch-d151a.firebaseapp.com",
    projectId: "airportsearch-d151a",
    storageBucket: "airportsearch-d151a.appspot.com",
    messagingSenderId: "686237913756",
    appId: "1:686237913756:web:adb3b64de1dbc0fef39359"
    // measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Variables
let slotAction = '';
let airportEmails = {}; // Store emails loaded from JSON
const logData = [];

// Load email data from JSON file
async function loadEmailData() {
    try {
        const response = await fetch('assets/emails.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        airportEmails = await response.json();
        console.log('Email data loaded:', airportEmails); // Debug loaded data
    } catch (error) {
        console.error('Error loading email data:', error);
        alert('Failed to load email data. Please check your JSON file.');
    }
}

// Login Function using Firebase Auth
function login(event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        displayError('Please enter both email and password.');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log('User signed in:', user.email);
            hideElement('errorMessage');
            hideElement('loginContainer');
            showElement('mainHeader');
            showElement('mainContainer');
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error signing in:', errorCode, errorMessage);
            displayError(errorMessage);
        });
}

// Logout Function
function logout() {
    auth.signOut().then(() => {
        console.log('User signed out');
        showElement('loginContainer');
        hideElement('mainHeader');
        hideElement('mainContainer');
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    });
}

// Helper Functions to Show/Hide Elements
function showElement(id) {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = 'block';
}

function hideElement(id) {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = 'none';
}

function displayError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Listen for Authentication State Changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        hideElement('loginContainer');
        showElement('mainHeader');
        showElement('mainContainer');
    } else {
        // No user is signed in
        console.log('No user is signed in');
        showElement('loginContainer');
        hideElement('mainHeader');
        hideElement('mainContainer');
    }
});

// Show the appropriate form based on the action selected
function createForm(action) {
    showElement('form-section');
    document.getElementById('form-title').textContent = `${action} Form`;
    slotAction = action.toUpperCase();
}

// Scroll to Top Function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show or Hide the Back to Top Button
window.onscroll = function () {
    const backToTopButton = document.getElementById('backToTop');
    if (document.documentElement.scrollTop > 200 || document.body.scrollTop > 200) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
};

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
    return dayValues[dayName] || '0000000'; // Default value if day not found
}

// Generate SCR message
function showSCR() {
    const slotType = document.getElementById('slotType').value;
    const airportCode = document.getElementById('airportCode').value.toUpperCase();
    const flightNumber = document.getElementById('flightNumber').value.trim();
    const dateInput = document.getElementById('date').value;
    const numberOfSeats = document.getElementById('numberOfSeats').value.padStart(3, '0');
    const aircraftType = document.getElementById('aircraftType').value.toUpperCase();
    const time = document.getElementById('time').value.padStart(4, '0');
    const destinationOrigin = document.getElementById('destinationOrigin').value.toUpperCase();
    const serviceType = document.getElementById('serviceType').value;

    // Validation
    if (!airportCode || !flightNumber || !dateInput || !numberOfSeats || !aircraftType || !time || !destinationOrigin) {
        alert("Please fill in all fields.");
        return;
    }

    const date = new Date(dateInput);
    if (isNaN(date)) {
        alert("Invalid date format.");
        return;
    }

    const dayValue = getDayValue(date);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const month = monthNames[date.getMonth()];
    const formattedDate = `${day}${month}`;

    // Decide if N (new) or D (delete/cancel) or C (change)
    let scrTypeIndicator = 'C'; // Default to Change
    if (slotAction === "CANCEL SLOT") {
        scrTypeIndicator = "D";
    } else if (slotAction === "NEW SLOT") {
        scrTypeIndicator = "N";
    }

    let scrMessage = `SCR  
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
    } else {
        alert("Invalid slot type selected.");
        return;
    }

    const scrMessageDiv = document.getElementById('scrMessage');
    scrMessageDiv.textContent = scrMessage.trim();
    scrMessageDiv.style.display = 'block';

    logData.push({
        slotAction,
        scrMessage: scrMessage.trim()
    });

    console.log('SCR Message Generated:', scrMessage.trim());
}

// Show logs in table format
function showLog() {
    const logContainer = document.getElementById('logContainer');
    const logTableBody = document.querySelector("#logTable tbody");
    logTableBody.innerHTML = ""; // Clear previous logs

    if (logData.length === 0) {
        logContainer.style.display = 'none';
        alert("No log data available.");
        return;
    }

    logData.forEach(log => {
        const row = logTableBody.insertRow();
        const cellAction = row.insertCell(0);
        const cellMessage = row.insertCell(1);
        cellAction.textContent = log.slotAction;
        cellMessage.textContent = log.scrMessage;
    });

    logContainer.style.display = "block";

    logContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Email SCR message
function emailSCR() {
    const scrMessage = document.getElementById('scrMessage').textContent;
    const airportCode = document.getElementById("airportCode").value.toUpperCase();
    const emailList = airportEmails[airportCode]?.email; // Retrieve 'email' field from JSON
    const ccEmail = "slotdesk@ryanair.com"; // Permanent CC email

    if (!scrMessage) {
        alert("No SCR message to email. Generate it first.");
        return;
    }

    if (!emailList) {
        alert(`No email found for airport code: ${airportCode}`);
        return;
    }

    const subject = encodeURIComponent(`${slotAction} REQ ${airportCode}`);
    const body = encodeURIComponent(scrMessage);
    const mailtoLink = `mailto:${emailList}?cc=${encodeURIComponent(ccEmail)}&subject=${subject}&body=${body}`;

    // Open mail client
    window.location.href = mailtoLink;
}

// Download logs as CSV
function downloadCSV() {
    if (logData.length === 0) {
        alert("No log data available to download.");
        return;
    }

    const csvRows = [
        ["Slot Action", "SCR Message"], // Headers
        ...logData.map(log => [log.slotAction, log.scrMessage.replace(/\n/g, " ")]) // Escape newlines
    ];

    const csvContent = csvRows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "scr_log.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Load email data when the page loads
window.addEventListener('DOMContentLoaded', () => {
    loadEmailData();

    // Attach submit event listener to the login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});

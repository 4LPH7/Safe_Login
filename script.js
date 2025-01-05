// Mock database to store user data
const users = [];
const loginAttempts = {}; // Store login attempts by IP address
const lockoutTime = {}; // Store lockout times for users
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 300000; // 5 minutes in milliseconds

// Handle login form submission
document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  const ipAddress = '127.0.0.1'; // Mock IP address for demonstration. Use actual method to get IP in a real scenario.

  // Check if email and password are provided
  if (!email || !password) {
    showMessage('loginMessage', 'Email and password are required.', 'red');
    return;
  }

  // Track login attempts from the same IP address
  if (!loginAttempts[ipAddress]) {
    loginAttempts[ipAddress] = [];
  }
  const now = Date.now();
  loginAttempts[ipAddress] = loginAttempts[ipAddress].filter(attempt => now - attempt < LOCKOUT_DURATION);

  if (loginAttempts[ipAddress].length >= MAX_ATTEMPTS) {
    showMessage('loginMessage', 'Too many login attempts from your IP. Try again later.', 'red');
    return;
  }

  // Find the user in the mock database
  const user = users.find((u) => u.email === email);

  // Check if the account is locked
  if (user && user.locked) {
    if (now < lockoutTime[email]) {
      showMessage('loginMessage', 'Account locked due to too many failed attempts. Try again later.', 'red');
      return;
    } else {
      // Unlock the account after lockout duration
      user.locked = false;
      delete lockoutTime[email];
    }
  }

  if (user && user.password === password) {
    showMessage('loginMessage', 'Login successful!', 'green');
    loginAttempts[ipAddress] = []; // Reset login attempts on successful login
  } else {
    loginAttempts[ipAddress].push(now);
    if (user) {
      if (loginAttempts[ipAddress].length >= MAX_ATTEMPTS) {
        user.locked = true;
        lockoutTime[email] = now + LOCKOUT_DURATION;
        showMessage('loginMessage', 'Account locked due to too many failed attempts.', 'red');
      } else {
        showMessage('loginMessage', 'Invalid email or password.', 'red');
      }
    } else {
      showMessage('loginMessage', 'Invalid email or password.', 'red');
    }
  }
};

// Handle signup form submission
document.getElementById('signupForm').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');

  // Check if name, email and password are provided
  if (!name || !email || !password) {
    showMessage('signupMessage', 'Name, email, and password are required.', 'red');
    return;
  }

  // Check if the user already exists
  const userExists = users.some((u) => u.email === email);

  if (userExists) {
    showMessage('signupMessage', 'User already exists.', 'red');
  } else {
    // Save the new user to the mock database
    users.push({ name, email, password, locked: false });
    showMessage('signupMessage', 'Signup successful! You can now log in.', 'green');

    // Clear the form
    e.target.reset();
  }
};

// Function to display messages
function showMessage(elementId, message, color) {
  const messageElement = document.getElementById(elementId);
  messageElement.innerText = message;
  messageElement.style.color = color;
}

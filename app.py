from flask import Flask, request, jsonify
import time
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)

# Configuration
MAX_ATTEMPTS = 5
BLOCK_TIME = timedelta(minutes=15)
LOCKOUT_DURATION = 300  # Lockout duration in seconds (5 minutes)

# Store login attempts by IP address and account lockout times
login_attempts = defaultdict(list)
lockout_time = {}  # Tracks lockout times for users (email)

# Simple in-memory user storage for demonstration
users = {"admin@123": {"password": "admin@123", "locked": False}}


@app.route("/")
def login_page():
    try:
        with open("index.html", "r") as file:
            return file.read()
    except FileNotFoundError:
        return "Login page not found. Please ensure 'index.html' is available.", 404


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    ip_address = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
    now = datetime.now()

    # Validate input
    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    # Handle IP-based login blocking (too many attempts)
    login_attempts[ip_address] = [attempt for attempt in login_attempts[ip_address] if attempt > now - BLOCK_TIME]

    if len(login_attempts[ip_address]) >= MAX_ATTEMPTS:
        return jsonify({"message": "Too many login attempts from your IP. Try again later."}), 429

    # Check if the account is locked (based on email)
    if email in lockout_time:
        if time.time() < lockout_time[email]:
            return jsonify({"message": "Account locked due to too many failed attempts. Try again later."}), 403
        else:
            # Unlock account after lockout duration
            lockout_time.pop(email, None)
            users[email]["locked"] = False

    # Validate user credentials
    if email in users and users[email]["password"] == password:
        if not users[email]["locked"]:
            # Reset failed attempts on successful login
            login_attempts[ip_address] = []
            return jsonify({"message": "Login successful!"}), 200
        else:
            return jsonify({"message": "Account is currently locked."}), 403
    else:
        # Increment failed attempts for the IP address
        login_attempts[ip_address].append(now)

        # Lock the account if maximum attempts are reached (for email)
        if len(login_attempts[ip_address]) >= MAX_ATTEMPTS:
            lockout_time[email] = time.time() + LOCKOUT_DURATION
            users[email]["locked"] = True
            return jsonify({"message": "Account locked due to too many failed attempts."}), 403

        return jsonify({"message": "Invalid email or password."}), 401


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # Validate request data
    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required."}), 400

    # Check if the email is already registered
    if email in users:
        return jsonify({"message": "Email already registered."}), 400

    # Add the new user to the database
    users[email] = {"password": password, "locked": False}
    return jsonify({"message": "Signup successful!"}), 200


if __name__ == "__main__":
    app.run(debug=True)
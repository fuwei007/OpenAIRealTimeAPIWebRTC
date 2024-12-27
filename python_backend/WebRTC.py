from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import requests
import os

app = Flask(__name__)

# Allow all domains to access your API (this is fine in development, but in production, specific domains should be restricted)
CORS(app)

# Configure OpenAI API URL and default instructions
OPENAI_API_URL = "https://api.openai.com/v1/realtime"
DEFAULT_INSTRUCTIONS = "You are helpful and have some tools installed.\n\nIn the tools you have the ability to control a robot hand."
OPENAI_API_KEY =  os.environ['OPENAI_API_KEY'] # Insert your own OpenAI key

# Homepage route (optional)
@app.route('/')
def home():
    return "Flask API is running!"

@app.route('/api/rtc-connect', methods=['POST'])
def connect_rtc():
    # Get the request body from the client
    body = request.get_data(as_text=True)

    # Build the OpenAI API request URL
    url = f"{OPENAI_API_URL}?model=gpt-4o-realtime-preview-2024-12-17&instructions={DEFAULT_INSTRUCTIONS}&voice=ash"

    # Set the request headers
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/sdp"
    }

    # Send POST request to the OpenAI API
    response = requests.post(url, headers=headers, data=body)

    # Return the OpenAI response, maintaining the same content type
    return response.content, 200, {'Content-Type': 'application/sdp'}

if __name__ == '__main__':
    # Set Flask app to run on port 8813
    app.run(debug=True, port=8813)

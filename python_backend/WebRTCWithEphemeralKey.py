from flask import Flask, request, Response
from flask_cors import CORS
import requests
import os
import json
import logging
from dotenv import load_dotenv

# Load environment variables from .env file (optional)
load_dotenv()

app = Flask(__name__)

# Configure CORS to allow all origins (adjust in production for better security)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY environment variable not set.")
    raise EnvironmentError("OPENAI_API_KEY environment variable not set.")

OPENAI_SESSION_URL = "https://api.openai.com/v1/realtime/sessions"
OPENAI_API_URL = "https://api.openai.com/v1/realtime"  # May vary based on requirements
MODEL_ID = "gpt-4o-realtime-preview-2024-12-17"
VOICE = "ash"  # Or other voices
DEFAULT_INSTRUCTIONS = "You are helpful and have some tools installed.\n\nIn the tools you have the ability to control a robot hand."

@app.route('/')
def home():
    return "Flask API is running!"

@app.route('/api/rtc-connect', methods=['POST'])
def connect_rtc():
    """
    RTC connection endpoint for handling WebRTC SDP exchange and generating/using ephemeral tokens.
    """
    try:
        # Step 1: Retrieve the client's SDP from the request body
        client_sdp = request.get_data(as_text=True)
        if not client_sdp:
            logger.error("No SDP provided in the request body.")
            return Response("No SDP provided in the request body.", status=400)

        logger.info("Received SDP from client.")

        # Step 2: Generate ephemeral API token
        token_headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        token_payload = {
            "model": MODEL_ID,
            "voice": VOICE
        }

        logger.info("Requesting ephemeral token from OpenAI.")

        token_response = requests.post(OPENAI_SESSION_URL, headers=token_headers, json=token_payload)

        if not token_response.ok:
            logger.error(f"Failed to obtain ephemeral token, status code: {token_response.status_code}, response: {token_response.text}")
            return Response(f"Failed to obtain ephemeral token, status code: {token_response.status_code}", status=500)

        token_data = token_response.json()
        # Adjust the path based on the actual response structure
        # Assuming the ephemeral token is located at `client_secret.value`
        ephemeral_token = token_data.get('client_secret', {}).get('value', '')

        if not ephemeral_token:
            logger.error("Ephemeral token is empty or not found in the response.")
            return Response("Ephemeral token is empty or not found in the response.", status=500)

        logger.info("Ephemeral token obtained successfully.")

        # Step 3: Perform SDP exchange with OpenAI's Realtime API using the ephemeral token
        sdp_headers = {
            "Authorization": f"Bearer {ephemeral_token}",
            "Content-Type": "application/sdp"
        }
        sdp_params = {
            "model": MODEL_ID,
            "instructions": DEFAULT_INSTRUCTIONS,
            "voice": VOICE
        }

        # Build the full URL with query parameters
        sdp_url = requests.Request('POST', OPENAI_API_URL, params=sdp_params).prepare().url

        logger.info(f"Sending SDP to OpenAI Realtime API at {sdp_url}")

        sdp_response = requests.post(sdp_url, headers=sdp_headers, data=client_sdp)

        if not sdp_response.ok:
            logger.error(f"OpenAI API SDP exchange error, status code: {sdp_response.status_code}, response: {sdp_response.text}")
            return Response(f"OpenAI API SDP exchange error, status code: {sdp_response.status_code}", status=500)

        logger.info("SDP exchange with OpenAI completed successfully.")

        # Step 4: Return OpenAI's SDP response to the client with the correct content type
        return Response(
            response=sdp_response.content,
            status=200,
            mimetype='application/sdp'
        )

    except Exception as e:
        logger.exception("An error occurred during the RTC connection process.")
        return Response(f"An error occurred: {str(e)}", status=500)

if __name__ == '__main__':
    # Ensure the server runs on port 8813
    app.run(debug=True, port=8813)

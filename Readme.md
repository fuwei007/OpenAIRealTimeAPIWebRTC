# 1. WebRTC
The main purpose of WebRTC is to enable audio stream transmission and data channel communication between browsers. WebRTC allows two browsers to communicate in real-time without the need for a traditional server intermediary.

## 1. Audio Stream Transmission:
Through WebRTC, code can capture the audio stream of the local browser (such as sound input from a microphone) and transmit it to a remote browser. This means that when a WebRTC connection is established, if the user speaks in the browser, the audio data can be transmitted in real-time to the remote end and played in the remote browser. In the code, `navigator.mediaDevices.getUserMedia({ audio: true })` captures the microphone's audio stream, and the audio stream is transmitted to the remote end through `peerConnection.addTransceiver(track)`.

## 2. Data Channel Communication:
In addition to supporting audio and video stream transmission, WebRTC also supports Data Channel communication. The Data Channel is a reliable, low-latency transmission method that can be used to transmit text, binary data, and other formats between browsers. In this code, the `dataChannel` is used to exchange JSON-formatted data. Through the data channel, browsers can not only transmit audio streams but also interact with remote systems via WebRTC. For example, when a remote system requests the execution of a JavaScript function (such as changing the background color or retrieving HTML content from a page), the data channel transmits these commands, the browser performs the operation, and the result is sent back through the data channel.

---

# 2. Functionality Implemented in the Demo
Retrieve current HTML element content, change webpage background color, change font color, change button size and color.

---

# 3. Detailed Steps:

## 1. Local Browser Initiates Request:
The user's browser initiates a connection request through WebRTC by sending a request to the backend's `/api/rtc-connect` interface. This request includes the local browser's media stream, network settings, and other information.

## 2. Backend Processes the Request:
The backend processes the request and calls the OpenAI API to generate the WebRTC SDP (Session Description Protocol) information. This SDP contains configuration information for audio streams, data channels, network addresses, and other parameters necessary to negotiate the WebRTC connection.

## 3. Backend Returns SDP Information:
The backend returns the SDP data to the local browser. This SDP data contains all the configuration information required for the WebRTC connection.

## 4. Local Browser Processes SDP Data:
The local browser uses the returned SDP data to initiate the connection through the WebRTC protocol. Specifically:
- Audio Stream: The local browser begins receiving and sending audio streams through WebRTC's audio settings (rtpmap, rtcp, etc.).
- Data Channel: The data channel setup is used for subsequent message transmission and control.
- ICE Connection: Through configurations like ice-ufrag and ice-pwd, the browser performs NAT traversal and establishes a network connection with the remote device.

## 5. WebRTC Connection Established:
The local browser establishes a WebRTC connection with the remote device (OpenAI API) and begins transmitting data through the audio stream and data channel.

## 6. Remote Device (OpenAI API):
In this scenario, the OpenAI API acts as the remote WebRTC endpoint, receiving audio stream data from the local browser, processing it, and returning appropriate data or audio feedback.

---

# 4. Configuration
1. Configure backend port, apiKey
2. Configure frontend link to the backend baseUrl

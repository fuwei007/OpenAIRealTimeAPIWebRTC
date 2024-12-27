// Set the basic API address for communication with the backend server
const baseUrl = "http://localhost:8813"; 
// Flag indicating whether WebRTC is active, controls the enabling and disabling of connections
let isWebRTCActive = false; 
// Create variables related to the WebRTC connection
let peerConnection; 
let dataChannel; 
// Define an object that contains multiple functions; methods in fns will be called
const fns = {
    // Get the HTML content of the current page
    getPageHTML: () => {
        return { 
            success: true, 
            html: document.documentElement.outerHTML 
        }; // Return the entire page's HTML
    },
    // Change the background color of the webpage
    changeBackgroundColor: ({ color }) => { 
        document.body.style.backgroundColor = color; // Change the page's background color 
        return { success: true, color }; // Return the changed color 
    },
    // Change the text color of the webpage
    changeTextColor: ({ color }) => { 
        document.body.style.color = color; // Change the page's text color 
        return { success: true, color }; // Return the changed color 
    },
    // Change the button's style (size and color)
    changeButtonStyle: ({ size, color }) => { 
        const button = document.querySelector('button'); // Get the first button on the page (modify selector if there are multiple buttons)
        if (button) {
            // Change the button's size
            if (size) {
                button.style.fontSize = size; // Set font size 
            }
            // Change the button's color
            if (color) {
                button.style.backgroundColor = color; // Set button background color 
            }
            return { success: true, size, color }; // Return modified button style 
        } else {
            return { success: false, message: 'Button element not found' }; // Return failure if no button is found 
        }
    },
}; 

// When an audio stream is received, add it to the page and play it
function handleTrack(event) { 
    const el = document.createElement('audio'); // Create an audio element 
    el.srcObject = event.streams[0]; // Set the audio stream as the element's source 
    el.autoplay = el.controls = true; // Autoplay and display audio controls 
    document.body.appendChild(el); // Add the audio element to the page 
} 

// Create a data channel for transmitting control messages (such as function calls)
function createDataChannel() { 
    // Create a data channel named 'response'
    dataChannel = peerConnection.createDataChannel('response'); 
    // Configure data channel events 
    dataChannel.addEventListener('open', () => { 
        console.log('Data channel opened'); 
        configureData(); // Configure data channel functions 
    }); 
    dataChannel.addEventListener('message', async (ev) => { 
        const msg = JSON.parse(ev.data); // Parse the received message 
        // If the message type is 'response.function_call_arguments.done', it indicates a function call request 
        if (msg.type === 'response.function_call_arguments.done') { 
            const fn = fns[msg.name]; // Get the corresponding function by name 
            if (fn !== undefined) { 
                console.log(`Calling local function ${msg.name}, parameters ${msg.arguments}`); 
                const args = JSON.parse(msg.arguments); // Parse function parameters 
                const result = await fn(args); // Call the local function and wait for the result 
                console.log('Result', result); // Log the result of the function 
                // Send the result of the function execution back to the other party
                const event = { 
                    type: 'conversation.item.create', // Create conversation item event 
                    item: { 
                        type: 'function_call_output', // Function call output 
                        call_id: msg.call_id, // Passed call_id 
                        output: JSON.stringify(result), // JSON string of the function execution result 
                    }, 
                }; 
                dataChannel.send(JSON.stringify(event)); // Send the result back to the remote side 
            } 
        } 
    }); 
} 

// Configure data channel functions and tools
function configureData() { 
    console.log('Configuring data channel'); 
    const event = { 
        type: 'session.update', // Session update event 
        session: { 
            modalities: ['text', 'audio'], // Supported interaction modes: text and audio 
            // Provide functional tools, pay attention to the names of these tools corresponding to the keys in the above fns object
            tools: [ 
                { 
                    type: 'function', // Tool type is function 
                    name: 'changeBackgroundColor', // Function name 
                    description: 'Change the background color of the webpage', // Description 
                    parameters: { // Parameter description 
                        type: 'object', 
                        properties: { 
                            color: { 
                                type: 'string', 
                                description: 'Hexadecimal value of the color' 
                            }, // Color parameter 
                        }, 
                    }, 
                }, 
                { 
                    type: 'function', 
                    name: 'changeTextColor', 
                    description: 'Change the text color of the webpage', 
                    parameters: { 
                        type: 'object', 
                        properties: { 
                            color: { 
                                type: 'string', 
                                description: 'Hexadecimal value of the color' 
                            }, 
                        }, 
                    }, 
                }, 
                { 
                    type: 'function', 
                    name: 'getPageHTML', 
                    description: 'Get the HTML content of the current page', 
                }, 
                { 
                    type: 'function', // Tool type is function 
                    name: 'changeButtonStyle', // New function name 
                    description: 'Change the size and color of the button', // Description 
                    parameters: { // Parameter description 
                        type: 'object', 
                        properties: { 
                            size: { 
                                type: 'string', 
                                description: 'Font size of the button (e.g., "16px" or "1em")' 
                            }, // Button size 
                            color: { 
                                type: 'string', 
                                description: 'Background color of the button (e.g., "#ff0000" or "red")' 
                            }, // Button color 
                        }, 
                    }, 
                }, 
            ], 
        }, 
    }; 
    dataChannel.send(JSON.stringify(event)); // Send the configured event data 
} 

// Get the control button element 
const toggleButton = document.getElementById('toggleWebRTCButton'); 
// Add a click event listener to the button to toggle the WebRTC connection state 
toggleButton.addEventListener('click', () => { 
    // If WebRTC is active, stop the connection; otherwise, start WebRTC 
    if (isWebRTCActive) { 
        stopWebRTC(); // Stop WebRTC 
        toggleButton.textContent = 'start'; // Update button text 
    } else { 
        startWebRTC(); // Start WebRTC 
        toggleButton.textContent = 'stop'; // Update button text 
    } 
}); 

// Capture microphone input stream and initiate WebRTC connection
function startWebRTC() { 
    // If WebRTC is already active, return directly 
    if (isWebRTCActive) return; 
    // Create a new peerConnection object to establish a WebRTC connection 
    peerConnection = new RTCPeerConnection(); 
    peerConnection.ontrack = handleTrack; // Bind audio stream processing function 
    createDataChannel(); // Create data channel 
    // Request user's audio stream 
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { 
        // Add each track from the audio stream to the peerConnection 
        stream.getTracks().forEach((track) => peerConnection.addTransceiver(track, { direction: 'sendrecv' })); 
        // Create an offer for the local connection 
        peerConnection.createOffer().then((offer) => { 
            peerConnection.setLocalDescription(offer); // Set local description (offer) 
            // Send the offer to the backend for signaling exchange 
            fetch(baseUrl + '/api/session', {
                method: 'POST', 
                body: offer.sdp, // Send the SDP of the offer to the backend 
                headers: { 
                    'Content-Type': 'application/sdp', 
                }, 
            }) 
            .then((r) => r.text()) 
            .then((answer) => { 
                // Get the answer returned by the backend and set it as the remote description 
                peerConnection.setRemoteDescription({ sdp: answer, type: 'answer' }); 
            }); 
        }); 
    }); 
    // Mark WebRTC as active 
    isWebRTCActive = true; 
} 

// Stop the WebRTC connection and clean up all resources
function stopWebRTC() { 
    // If WebRTC is not active, return directly 
    if (!isWebRTCActive) return; 
    // Stop the received audio tracks 
    const tracks = peerConnection.getReceivers().map(receiver => receiver.track); 
    tracks.forEach(track => track.stop()); 
    // Close the data channel and WebRTC connection 
    if (dataChannel) dataChannel.close(); 
    if (peerConnection) peerConnection.close(); 
    // Reset connection and channel objects 
    peerConnection = null; 
    dataChannel = null; 
    // Mark WebRTC as not active 
    isWebRTCActive = false; 
}
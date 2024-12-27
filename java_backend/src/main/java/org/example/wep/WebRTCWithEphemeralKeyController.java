package org.example.wep;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api")
public class WebRTCWithEphemeralKeyController {

    @Value("${apiKey}")
    private String openaiApiKey;

    private static final String OPENAI_SESSION_URL = "https://api.openai.com/v1/realtime/sessions";
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/realtime"; // May vary based on requirements
    private static final String MODEL_ID = "gpt-4o-realtime-preview-2024-12-17";
    private static final String VOICE = "ash"; // Or other voices
    private static final String DEFAULT_INSTRUCTIONS = "You are helpful and have some tools installed.\n\nIn the tools you have the ability to control a robot hand.";

    /**
     * RTC connection endpoint for handling WebRTC SDP exchange and generating/using ephemeral tokens.
     */
    @CrossOrigin(origins = "*") // Adjust allowed origins as needed to enhance security
    @PostMapping("/rtc-connect")
    public ResponseEntity<String> connectRTC(@RequestBody String clientSdp) {
        RestTemplate restTemplate = new RestTemplate();

        // Step 1: Generate ephemeral API token
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.set("Authorization", "Bearer " + openaiApiKey);
        tokenHeaders.setContentType(MediaType.APPLICATION_JSON);

        String tokenRequestBody = String.format("{\"model\": \"%s\", \"voice\": \"%s\"}", MODEL_ID, VOICE);

        HttpEntity<String> tokenRequestEntity = new HttpEntity<>(tokenRequestBody, tokenHeaders);

        ResponseEntity<String> tokenResponse = restTemplate.exchange(
                OPENAI_SESSION_URL,
                HttpMethod.POST,
                tokenRequestEntity,
                String.class
        );

        if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to obtain ephemeral token, status code: " + tokenResponse.getStatusCode());
        }

        // Assuming the returned JSON contains a `client_secret.value` field as the ephemeral token
        // Needs to be parsed based on the actual response structure
        String ephemeralToken;
        try {
            // Use Jackson or another JSON parsing library to parse the response
            // Here, assuming Jackson is used
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(tokenResponse.getBody());
            ephemeralToken = root.path("client_secret").path("value").asText();

            if (ephemeralToken == null || ephemeralToken.isEmpty()) {
                throw new RuntimeException("Ephemeral token is empty");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse ephemeral token: " + e.getMessage());
        }

        // Step 2: Use the ephemeral token to perform SDP exchange with OpenAI's Realtime API
        // Build the URL
        String url = UriComponentsBuilder.fromHttpUrl(OPENAI_API_URL)
                .queryParam("model", MODEL_ID)
                .queryParam("instructions", DEFAULT_INSTRUCTIONS)
                .queryParam("voice", VOICE)
                .toUriString();

        // Set request headers
        HttpHeaders sdpHeaders = new HttpHeaders();
        sdpHeaders.set("Authorization", "Bearer " + ephemeralToken);
        sdpHeaders.setContentType(MediaType.parseMediaType("application/sdp"));

        // Create the request entity
        HttpEntity<String> sdpRequestEntity = new HttpEntity<>(clientSdp, sdpHeaders);

        // Send SDP to OpenAI Realtime API
        ResponseEntity<String> sdpResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                sdpRequestEntity,
                String.class
        );

        if (!sdpResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI API SDP exchange error, status code: " + sdpResponse.getStatusCode());
        }

        // Return OpenAI's SDP response to the client
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/sdp"))
                .body(sdpResponse.getBody());
    }

}

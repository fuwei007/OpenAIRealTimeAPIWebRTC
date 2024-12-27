package org.example.wep;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
public class WebRTCController {



    @Value("${apiKey}")
    private String openaiApiKey;
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/realtime";
    private static final String DEFAULT_INSTRUCTIONS = "You are helpful and have some tools installed.\n\nIn the tools you have the ability to control a robot hand.";

    @CrossOrigin(origins = "*") // Allow requests from this origin
    @PostMapping("/api/rtc-connect")
    public ResponseEntity<String> connectRTC(@RequestBody String body) {
        // Build the URL with query parameters
        String url = UriComponentsBuilder.fromHttpUrl(OPENAI_API_URL)
                .queryParam("model", "gpt-4o-realtime-preview-2024-12-17")
                .queryParam("instructions", DEFAULT_INSTRUCTIONS)
                .queryParam("voice", "ash")
                .toUriString();

        // Set up the headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openaiApiKey);
        headers.setContentType(MediaType.parseMediaType("application/sdp"));

        // Create the request entity
        org.springframework.http.HttpEntity<String> requestEntity = new org.springframework.http.HttpEntity<>(body, headers);

        // Send the request to OpenAI API
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

        // If response is not OK, throw an exception
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI API error: " + response.getStatusCode());
        }

        // Return the SDP response with the correct content type
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/sdp"))
                .body(response.getBody());
    }
}
// audioRecorder.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the DOM elements
    const audioRecordToggle = document.getElementById('audioRecordToggle');
    const keyboardInput = document.getElementById('keyboardInput');
    const icon = audioRecordToggle.querySelector('i');
    const textSpan = audioRecordToggle.querySelector('span');

    // State variables for recording
    let mediaRecorder;        // Stores the MediaRecorder instance
    let audioChunks = [];     // Stores chunks of audio data during recording
    let isRecording = false;  // Tracks the current recording state (true/false)
    let audioStream;          // Stores the MediaStream object from getUserMedia

    // --- Browser Compatibility Check ---
    // Ensure the browser supports MediaDevices API for microphone access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audioRecordToggle.disabled = true; // Disable the button if not supported
        textSpan.textContent = "Audio Not Supported"; // Inform the user
        console.error('getUserMedia not supported on your browser! Please use a modern browser.');
        return; // Exit if not supported
    }

    // --- Function to Start Recording ---
    const startRecording = async () => {
        try {
            // 1. Disable button and show spinner while getting microphone access
            audioRecordToggle.disabled = true;
            icon.className = 'fas fa-spinner fa-spin'; // Font Awesome spinner icon
            textSpan.textContent = "Getting microphone...";

            // 2. Request microphone access
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 3. Initialize MediaRecorder
            mediaRecorder = new MediaRecorder(audioStream);
            audioChunks = []; // Clear any previous audio chunks

            // 4. Event handler for when audio data is available
            mediaRecorder.ondataavailable = event => {
                // If there's data, add it to our array
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            // 5. Event handler for when recording stops
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Create a Blob from the audio chunks (WAV format recommended for STT)

                // Immediately indicate processing state to the user
                audioRecordToggle.disabled = true;
                icon.className = 'fas fa-spinner fa-spin'; // Spinner icon
                textSpan.textContent = "Transcribing...";
                audioRecordToggle.classList.remove('recording'); // Remove the recording visual styles

                // Stop all tracks in the audio stream to turn off the microphone light
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    audioStream = null; // Clear the stream reference
                }

                // --- IMPORTANT: Placeholder for actual Speech-to-Text (STT) Integration ---
                // This is the critical part for accurate transcription.
                // The current implementation uses a simulated transcription.
                //
                // For real-world use with Tifinagh, you would need:
                // 1. A backend server: Your frontend JS sends 'audioBlob' to your server.
                // 2. A powerful STT API: Your server calls a cloud-based STT service (e.g., Google Cloud Speech-to-Text,
                //    AWS Transcribe, Azure Cognitive Services) or a specialized open-source model.
                //    These services might require a specific language model for Berber/Tifinagh for accuracy.
                // 3. Response: The STT service returns the Tifinagh text to your server, which then sends it back to the frontend.

                console.log("Audio recorded. Simulating transcription for now...");
                console.log("Audio Blob size:", audioBlob.size, "type:", audioBlob.type);

                // Simulate an API call delay and a Tifinagh transcription result
                setTimeout(() => {
                    // This is the SIMULATED Tifinagh transcription.
                    // Replace "ⴰⵣⵓⵍ ⴰⵎⴰⵣⵉⵖ" with the actual result from your STT API.
                    const simulatedTifinaghTranscription = "ⴰⵣⵓⵍ ⴰⵎⴰⵣⵉⵖ"; // "Hello Amazigh" in Tifinagh

                    // Append the transcribed text to the keyboard input area
                    keyboardInput.value += simulatedTifinaghTranscription + ' ';
                    keyboardInput.focus(); // Keep focus on the textarea for continuous typing

                    // Reset button state after transcription is complete
                    audioRecordToggle.disabled = false;
                    icon.className = 'fas fa-microphone'; // Microphone icon
                    textSpan.textContent = "Start Recording";
                    isRecording = false; // Update recording state
                }, 2000); // Simulate a 2-second processing delay
            };

            // 6. Start the recording
            mediaRecorder.start();
            isRecording = true; // Update recording state
            audioRecordToggle.disabled = false; // Re-enable button
            audioRecordToggle.classList.add('recording'); // Add recording visual styles
            icon.className = 'fas fa-stop-circle'; // Change icon to a stop circle
            textSpan.textContent = "Stop Recording"; // Change text to "Stop Recording"
            console.log("Recording started...");

        } catch (err) {
            // Handle errors if microphone access is denied or fails
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please ensure it is connected and permissions are granted.');

            // Reset button state on error
            audioRecordToggle.disabled = false;
            audioRecordToggle.classList.remove('recording');
            icon.className = 'fas fa-microphone';
            textSpan.textContent = "Start Recording";
            isRecording = false; // Ensure recording state is reset

            // If an error occurred after stream acquisition but before starting, stop tracks
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
        }
    };

    // --- Function to Stop Recording ---
    const stopRecording = () => {
        // Only stop if the mediaRecorder exists and is currently recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            console.log("Recording stopped.");
            // The `mediaRecorder.onstop` event handler will take over from here
            // to process the audio and update the UI.
        }
    };

    // --- Event Listener for the Audio Toggle Button ---
    audioRecordToggle.addEventListener('click', () => {
        if (!isRecording) {
            startRecording(); // If not recording, start it
        } else {
            stopRecording();  // If recording, stop it
        }
    });

    // --- Optional: Implement a Latin to Tifinagh mapping function if your STT returns Latin ---
    // This is a complex task and would require a comprehensive mapping and potentially
    // linguistic rules to be accurate. The example below is a very basic placeholder.
    /*
    function mapLatinToTifinagh(latinText) {
        const charMap = {
            'a': 'ⴰ', 'b': 'ⴱ', 'd': 'ⴷ', 'ḍ': 'ⴹ', 'e': 'ⴻ',
            'f': 'ⴼ', 'g': 'ⴳ', 'h': 'ⵀ', 'ḥ': 'ⵃ', 'i': 'ⵉ',
            'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
            'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', 'ṛ': 'ⵕ', 's': 'ⵙ',
            'ṣ': 'ⵚ', 't': 'ⵜ', 'ṭ': 'ⵟ', 'u': 'ⵓ',
            'v': 'ⵠ', 'w': 'ⵡ', 'y': 'ⵢ', 'z': 'ⵣ', 'ẓ': 'ⵥ',
            ' ': ' ', // Space
            // Digraphs (multi-character Latin for single Tifinagh)
            'kh': 'ⵅ', 'ch': 'ⵛ', 'gh': 'ⵖ', // Common Berber digraphs (adjust based on dialect)
            'sh': 'ⵛ', // Example for 'sh' -> 'ⵛ'
            'ou': 'ⵓ', // Example
            // Add other common Latin-to-Tifinagh mappings
            // Note: This is a simplified map. True conversion needs linguistic context.
        };

        let result = '';
        let i = 0;
        while (i < latinText.length) {
            let matched = false;
            // Try matching 2-char combinations first (e.g., 'sh' before 's')
            if (i + 1 < latinText.length) {
                const twoChar = latinText.substring(i, i + 2).toLowerCase();
                if (charMap[twoChar]) {
                    result += charMap[twoChar];
                    i += 2;
                    matched = true;
                }
            }
            // If no 2-char match, try 1-char
            if (!matched) {
                const oneChar = latinText[i].toLowerCase();
                if (charMap[oneChar]) {
                    result += charMap[oneChar];
                } else {
                    result += latinText[i]; // Keep unrecognized characters as is
                }
                i++;
            }
        }
        return result;
    }
    */
});

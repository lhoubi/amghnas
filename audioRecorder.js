// audioRecorder.js

document.addEventListener('DOMContentLoaded', () => {
    const audioRecordToggle = document.getElementById('audioRecordToggle');
    const keyboardInput = document.getElementById('keyboardInput');
    const icon = audioRecordToggle.querySelector('i');
    const textSpan = audioRecordToggle.querySelector('span');
    const sttStatus = document.getElementById('sttStatus');
    const debugOutput = document.getElementById('debugOutput');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false; // Tracks our UI/logic state
    let micStream = null;
    let sendIntervalId = null; // To manage our continuous audio sending
    let lastPartialTranscription = ""; // Stores the last known partial transcription (Latin)
    let currentFullTranscriptionPrefix = ""; // Stores the confirmed transcription that precedes the current partial (Tifinagh)

    // --- Browser Compatibility Check for MediaRecorder ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audioRecordToggle.disabled = true;
        textSpan.textContent = "Mic Not Supported";
        sttStatus.textContent = "Your browser does not support audio recording. Please update or use a modern browser.";
        console.error('MediaRecorder API not supported on this browser.');
        return; // Exit if not supported
    }

    // --- Latin to Tifinagh Mapping Function (Unchanged - IMPORTANT: keep this for display) ---
    function latinToTifinagh(latinText) {
        // ... (Your existing latinToTifinagh function here) ...
        const complexMappings = {
            'kh': 'ⵅ', 'gh': 'ⵖ', 'ch': 'ⵛ', 'sh': 'ⵛ',
            'dj': 'ⴷⵊ', 'ts': 'ⵜⵙ',
            'tt': 'ⵜⵜ', 'kk': 'ⴽⴽ', 'll': 'ⵍⵍ', 'nn': 'ⵏⵏ', 'rr': 'ⵔⵔ', 'ss': 'ⵙⵙ', 'zz': 'ⵣⵣ', 'yy': 'ⵢⵢ',
            'ḍ': 'ⴹ', 'ṭ': 'ⵟ', 'ṣ': 'ⵚ', 'ẓ': 'ⵥ', 'ṛ': 'ⵕ',
            'w': 'ⵡ', 'a': 'ⴰ', 'e': 'ⴻ', 'i': 'ⵉ', 'o': 'ⵓ', 'u': 'ⵓ',
            'b': 'ⴱ', 'd': 'ⴷ', 'f': 'ⴼ', 'g': 'ⴳ', 'h': 'ⵀ',
            'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
            'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', 's': 'ⵙ',
            't': 'ⵜ', 'v': 'ⵠ', 'y': 'ⵢ', 'z': 'ⵣ',
            'c': 'ⵄ', 'ɣ': 'ⵖ', 'ḥ': 'ⵃ', 'ɛ': 'ⵄ', 'č': 'ⵛ',
            'ا': 'ⴰ', 'ب': 'ⴱ', 'د': 'ⴷ', 'ض': 'ⴹ', 'ف': 'ⴼ',
            'ڭ': 'ⴳ', 'ه': 'ⵀ', 'ح': 'ⵃ', 'إ': 'ⵉ', 'ج': 'ⵊ',
            'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ', 'پ': 'ⵒ',
            'ق': 'ⵇ', 'ر': 'ⵔ', 'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ',
            'ت': 'ⵜ', 'ط': 'ⵟ', 'أُ': 'ⵓ', 'ڤ': 'ⵠ', 'و': 'ⵡ',
            'خ': 'ⵅ', 'ي': 'ⵢ', 'ز': 'ⵣ', 'ـ': 'ⵯ', 'ع': 'ⵄ',
            ' ': ' ', '.': '.', ',': ',', '?': '?', '!': '!',
            '-': '-', '\'': '\'', '"': '"', '(': '(', ')': ')',
            '؟': '?', '،': ',',
        };

        let tifinaghText = '';
        let i = 0;
        const lowerLatin = latinText.toLowerCase();

        while (i < lowerLatin.length) {
            let matched = false;
            for (let len = 3; len >= 1; len--) {
                if (i + len <= lowerLatin.length) {
                    const segment = lowerLatin.substring(i, i + len);
                    if (complexMappings[segment]) {
                        tifinaghText += complexMappings[segment];
                        i += len;
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                const char = lowerLatin[i];
                if (complexMappings[char]) {
                    tifinaghText += complexMappings[char];
                    i++;
                    matched = true;
                } else {
                    const charWithoutDiacritic = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (complexMappings[charWithoutDiacritic]) {
                         tifinaghText += complexMappings[charWithoutDiacritic];
                         i++;
                         matched = true;
                    } else {
                         tifinaghText += latinText[i];
                         i++;
                    }
                }
            }
        }
        return tifinaghText;
    }


    // --- Simulate a Backend Tamazight STT Service for real-time (MODIFIED) ---
    const mockResponsesPool = [
        "azul fellawen", "manzaɣ immi", "nek d Amzigh", "tamaziɣt tuḍfi", "axam-inu",
        "aman iggi", "afus afus", "tudert n tmaziɣt", "adrar n snu",
        "azul fellam a yemma", "tassawit n wawal", "iẓlan imaziɣen",
    ];
    let selectedMockResponse = "";
    let mockResponseCharIndex = 0; // Tracks how much of the selectedMockResponse has been "transcribed"

    async function simulateTamazightSTT(audioBlob, isFinal = false) {
        if (!selectedMockResponse) {
            // Pick a new random response at the start of a recording session
            selectedMockResponse = mockResponsesPool[Math.floor(Math.random() * mockResponsesPool.length)];
            mockResponseCharIndex = 0; // Reset for new response
        }

        sttStatus.textContent = "Sending audio to backend STT (simulated)...";
        debugOutput.textContent = `Simulating STT for ${audioBlob.size} bytes. IsFinal: ${isFinal}`;
        console.log(`Simulating STT for audio blob of size: ${audioBlob.size}, isFinal: ${isFinal}`);

        return new Promise(resolve => {
            // Simulate network latency and processing time, but faster for real-time feel
            setTimeout(() => {
                let partialResult = "";
                if (!isFinal) {
                    // Simulate receiving partial results over time
                    // Advance the index by a random amount (1-3 characters) to make it look dynamic
                    mockResponseCharIndex = Math.min(mockResponseCharIndex + 1 + Math.floor(Math.random() * 3), selectedMockResponse.length);
                    partialResult = selectedMockResponse.substring(0, mockResponseCharIndex);
                } else {
                    // When final, send the complete response
                    partialResult = selectedMockResponse;
                    selectedMockResponse = ""; // Reset for next recording
                    mockResponseCharIndex = 0;
                }

                if (partialResult) {
                    sttStatus.textContent = `Partial STT: "${partialResult}"`;
                    debugOutput.textContent = `Simulated STT Output: "${partialResult}" (isFinal: ${isFinal})`;
                    console.log(`Simulated STT output: "${partialResult}" (isFinal: ${isFinal})`);
                } else {
                    sttStatus.textContent = isFinal ? "No speech recognized." : "Waiting for speech...";
                    debugOutput.textContent = "Simulated STT: No partial result yet.";
                    console.log("Simulated STT: No partial result yet.");
                }
                resolve(partialResult);
            }, 200 + Math.random() * 200); // Shorter delay for "instant" feel
        });
    }

    // --- Helper function to reset UI state ---
    function resetUI() {
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
        audioRecordToggle.disabled = false; // Ensure button is re-enabled
        sttStatus.textContent = "Ready to record."; // More professional initial status
        debugOutput.textContent = ""; // Clear debug on reset
        console.log("UI reset to 'Start Recording' state.");

        // Clear any pending send interval
        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            sendIntervalId = null;
        }

        // Reset transcription states
        lastPartialTranscription = "";
        currentFullTranscriptionPrefix = "";
        selectedMockResponse = ""; // Reset mock response for the next recording
        mockResponseCharIndex = 0;
    }

    // --- MediaRecorder Event Handlers ---
    function onDataAvailable(event) {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
            console.log("Audio data available, chunk size:", event.data.size);
        }
    }

    async function onStop() {
        console.log("MediaRecorder onStop event fired. State:", mediaRecorder ? mediaRecorder.state : 'undefined');

        // Stop the continuous sending interval immediately
        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            sendIntervalId = null;
            console.log("Stopped continuous audio sending interval.");
        }

        // Stop all tracks in the stream
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped.");
            });
            micStream = null;
        }

        sttStatus.textContent = "Finalizing transcription...";
        audioRecordToggle.disabled = true; // Disable during processing

        // Send any remaining chunks as a final request
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = []; // Clear chunks for next recording
            if (audioBlob.size > 0) {
                try {
                    const finalTamazightLatinOutput = await simulateTamazightSTT(audioBlob, true); // Mark as final
                    if (finalTamazightLatinOutput) {
                        const tifinaghOutput = latinToTifinagh(finalTamazightLatinOutput);
                        
                        // Remove the last partial (which was still based on the mock)
                        // and append the full, final transcription.
                        let currentInputValue = keyboardInput.value;
                        if (lastPartialTranscription && currentInputValue.endsWith(latinToTifinagh(lastPartialTranscription))) {
                            currentInputValue = currentInputValue.slice(0, -latinToTifinagh(lastPartialTranscription).length);
                        }
                        
                        keyboardInput.value = currentInputValue + tifinaghOutput + ' '; // Add space after final word
                        currentFullTranscriptionPrefix = currentInputValue + tifinaghOutput + ' '; // Update prefix
                        keyboardInput.scrollTop = keyboardInput.scrollHeight;
                        sttStatus.textContent = "Transcription complete.";
                        lastPartialTranscription = ""; // Clear for next round
                    } else {
                        sttStatus.textContent = "No speech recognized during final pass.";
                    }
                } catch (error) {
                    console.error("Error during final STT process:", error);
                    sttStatus.textContent = "Error processing final speech.";
                    debugOutput.textContent = "Error: " + error.message;
                }
            } else {
                sttStatus.textContent = "No audio recorded (too short or silent).";
                debugOutput.textContent = "No audio data was captured during the last recording.";
                console.warn("No audio data captured.");
            }
        } else {
            sttStatus.textContent = "No new audio chunks to finalize.";
        }

        resetUI(); // Always reset UI after recording stops or processing finishes
    }

    function onMediaRecorderError(event) {
        console.error('MediaRecorder error:', event.error);
        sttStatus.textContent = `Recording error: ${event.error.name}: ${event.error.message}`;
        debugOutput.textContent = `MediaRecorder Error: ${event.error.message}`;

        // Stop interval and mic stream on error
        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            sendIntervalId = null;
            console.log("Stopped continuous audio sending interval due to error.");
        }
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped due to error.");
            });
            micStream = null;
        }
        resetUI(); // Reset UI on error
    }

    // --- Function to send accumulated audio chunks to STT (for real-time) ---
    async function sendAudioChunks() {
        if (audioChunks.length === 0) {
            debugOutput.textContent = "No audio chunks to send yet.";
            return;
        }

        // Combine chunks and clear for the next interval
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = []; // Clear chunks *after* creating blob for sending

        try {
            const partialTamazightLatinOutput = await simulateTamazightSTT(audioBlob, false); // Mark as not final
            if (partialTamazightLatinOutput) {
                const tifinaghOutput = latinToTifinagh(partialTamazightLatinOutput);

                // Update keyboardInput: remove previous partial, add new one
                // Ensure we only modify the current 'partial' part of the input,
                // leaving any previously confirmed text intact.
                let currentInputValue = keyboardInput.value;
                
                // If there was a previous partial, remove its Tifinagh representation
                if (lastPartialTranscription) {
                    const lastPartialTifinagh = latinToTifinagh(lastPartialTranscription);
                    if (currentInputValue.endsWith(lastPartialTifinagh)) {
                        currentInputValue = currentInputValue.slice(0, -lastPartialTifinagh.length);
                    }
                }
                
                keyboardInput.value = currentInputValue + tifinaghOutput;
                keyboardInput.scrollTop = keyboardInput.scrollHeight;
                lastPartialTranscription = partialTamazightLatinOutput; // Store this partial for future replacement
            }
        } catch (error) {
            console.error("Error sending partial audio to STT:", error);
            debugOutput.textContent = "Error sending partial audio: " + error.message;
        }
    }


    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', async () => {
        if (!isRecording) {
            // Start Recording flow
            sttStatus.textContent = "Requesting microphone access...";
            debugOutput.textContent = "";
            console.log("Attempting to get microphone access...");
            audioRecordToggle.disabled = true; // Disable button *while* async mic request is pending

            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted.");

                mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/webm' }); // Explicitly set mimeType
                mediaRecorder.ondataavailable = onDataAvailable;
                mediaRecorder.onstop = onStop;
                mediaRecorder.onerror = onMediaRecorderError;

                // Start recording, requesting data every 500ms
                mediaRecorder.start(500); // This creates chunks every 500ms
                console.log("MediaRecorder.start(500) called. State:", mediaRecorder.state);

                // Start sending chunks every 1 second (adjust as needed for responsiveness vs. simulated load)
                sendIntervalId = setInterval(sendAudioChunks, 1000);
                console.log("Started continuous audio sending interval.");

                isRecording = true; // Update our state
                audioRecordToggle.disabled = false; // Re-enable button
                audioRecordToggle.classList.add('recording'); // Apply red style
                icon.className = 'fas fa-stop-circle';
                textSpan.textContent = "Stop Recording";
                sttStatus.textContent = "Recording...";
                keyboardInput.focus();

            } catch (err) {
                console.error('Microphone access denied or error:', err);
                sttStatus.textContent = `Microphone access denied: ${err.name}. Please check permissions.`;
                debugOutput.textContent = `Microphone Error: ${err.message}. Please enable microphone access for this site.`;
                resetUI(); // Reset UI state on error
            }
        } else {
            // Stop Recording flow
            console.log("Stop button clicked. MediaRecorder state:", mediaRecorder ? mediaRecorder.state : 'undefined');
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                audioRecordToggle.disabled = true; // Disable button during stop/processing
                sttStatus.textContent = "Stopping recording...";
                mediaRecorder.stop();
                // onStop will handle further UI updates and re-enabling
            } else {
                console.warn("Attempted to stop MediaRecorder when it was not in 'recording' state. Force resetting.");
                debugOutput.textContent = "Recorder not active. Force resetting.";
                resetUI(); // Force reset if state is unexpected
            }
        }
    });

    // Initial status message
    resetUI(); // Set initial state and status
});

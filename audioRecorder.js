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

    // --- Configuration for Real STT Backend ---
    const STT_API_ENDPOINT = 'http://localhost:5000/transcribe_chunk'; // IMPORTANT: Set your actual backend URL here

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
            'ا': 'ⴰ', 'ب': 'ⴱ', 'ⴷ': 'ⴷ', 'ض': 'ⴹ', 'ف': 'ⴼ',
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

    // --- Send audio to REAL STT Backend (NEW FUNCTION) ---
    async function sendAudioToRealSTT(audioBlob) {
        sttStatus.textContent = "Sending audio to backend STT...";
        debugOutput.textContent = `Sending ${audioBlob.size} bytes of audio...`;
        console.log(`Sending audio blob of size: ${audioBlob.size}`);

        try {
            const formData = new FormData();
            // IMPORTANT CHANGE HERE: Change the filename extension to match the blob type
            formData.append('audio', audioBlob, 'audio.wav'); // Changed from 'audio.webm' to 'audio.wav'

            const response = await fetch(STT_API_ENDPOINT, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`STT API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const transcription = data.transcription || ""; // Expect 'transcription' key
            
            sttStatus.textContent = `STT Output: "${transcription}"`;
            debugOutput.textContent = `STT Raw Output: "${transcription}"`;
            console.log("Real STT output:", transcription);
            return transcription; // This will be Latin text
            
        } catch (error) {
            console.error("Error sending audio to real STT backend:", error);
            sttStatus.textContent = "Error communicating with STT backend.";
            debugOutput.textContent = "Error: " + error.message;
            return ""; // Return empty string on error
        }
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
            // IMPORTANT CHANGE HERE: Change the Blob type to audio/wav
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Changed from 'audio/webm'
            audioChunks = []; // Clear chunks for next recording
            if (audioBlob.size > 0) {
                try {
                    const finalTamazightLatinOutput = await sendAudioToRealSTT(audioBlob); // Use real STT
                    if (finalTamazightLatinOutput) {
                        const tifinaghOutput = latinToTifinagh(finalTamazightLatinOutput);
                        
                        // Remove the last partial and append the full, final transcription.
                        let currentInputValue = keyboardInput.value;
                        if (lastPartialTranscription && currentInputValue.endsWith(latinToTifinagh(lastPartialTranscription))) {
                            currentInputValue = currentInputValue.slice(0, -latinToTifinagh(lastPartialTranscription).length);
                        }
                        
                        keyboardInput.value = currentInputValue + tifinaghOutput + ' '; // Add space after final word
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

        // IMPORTANT CHANGE HERE: Change the Blob type to audio/wav
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Changed from 'audio/webm'
        audioChunks = []; // Clear chunks *after* creating blob for sending

        try {
            // Use the real STT function
            const partialTamazightLatinOutput = await sendAudioToRealSTT(audioBlob); // This is Latin text
            
            if (partialTamazightLatinOutput) {
                const tifinaghOutput = latinToTifinagh(partialTamazightLatinOutput);

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
            } else {
                // If STT returns empty (e.g., no speech detected in chunk), clear last partial
                if (lastPartialTranscription) {
                    let currentInputValue = keyboardInput.value;
                    const lastPartialTifinagh = latinToTifinagh(lastPartialTranscription);
                    if (currentInputValue.endsWith(lastPartialTifinagh)) {
                        keyboardInput.value = currentInputValue.slice(0, -lastPartialTifinagh.length);
                    }
                    lastPartialTranscription = ""; // Clear the stored partial
                }
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
            
            // --- FIX APPLIED HERE: Disable button IMMEDIATELY before starting the async process ---
            audioRecordToggle.disabled = true; 

            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted.");

                // --- FIX APPLIED HERE: Re-enable the button promptly after mic access is granted ---
                audioRecordToggle.disabled = false; 

                // IMPORTANT CHANGE HERE: Specify 'audio/wav' as the mimeType
                mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/wav' }); // Changed from 'audio/webm'
                mediaRecorder.ondataavailable = onDataAvailable;
                mediaRecorder.onstop = onStop;
                mediaRecorder.onerror = onMediaRecorderError;

                // Start recording, requesting data every 500ms
                mediaRecorder.start(500); // This creates chunks every 500ms
                console.log("MediaRecorder.start(500) called. State:", mediaRecorder.state);

                // Start sending chunks every 1 second (adjust for responsiveness vs. backend load)
                sendIntervalId = setInterval(sendAudioChunks, 1000);
                console.log("Started continuous audio sending interval.");

                isRecording = true; // Update our state
                audioRecordToggle.classList.add('recording'); // Apply red style
                icon.className = 'fas fa-stop-circle';
                textSpan.textContent = "Stop Recording";
                sttStatus.textContent = "Recording...";
                keyboardInput.focus();

            } catch (err) {
                console.error('Microphone access denied or error:', err);
                sttStatus.textContent = `Microphone access denied: ${err.name}. Please check permissions.`;
                debugOutput.textContent = `Microphone Error: ${err.message}. Please enable microphone access for this site.`;
                resetUI(); // Reset UI state on error, which will re-enable the button
            } finally {
                // --- FIX APPLIED HERE: Failsafe to ensure button is enabled if recording didn't start ---
                if (!isRecording) { 
                    audioRecordToggle.disabled = false;
                }
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
                resetUI(); // Force reset if state is unexpected, which will re-enable the button
            }
        }
    });

    // Initial status message
    resetUI(); // Set initial state and status
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing audio recorder script.");

    const audioRecordToggle = document.getElementById('audioRecordToggle');
    const keyboardInput = document.getElementById('keyboardInput');
    const icon = audioRecordToggle ? audioRecordToggle.querySelector('i') : null; // Safe access
    const textSpan = audioRecordToggle ? audioRecordToggle.querySelector('span') : null; // Safe access
    const sttStatus = document.getElementById('sttStatus');
    const debugOutput = document.getElementById('debugOutput');

    // --- Check if elements were found ---
    if (!audioRecordToggle) {
        console.error("Error: audioRecordToggle element not found! Check your HTML ID.");
        return; // Stop execution if the main button is missing
    }
    if (!keyboardInput) {
        console.error("Error: keyboardInput element not found! Check your HTML ID.");
    }
    if (!sttStatus) {
        console.error("Error: sttStatus element not found! Check your HTML ID.");
    }
    if (!debugOutput) {
        console.error("Error: debugOutput element not found! Check your HTML ID.");
    }
    if (!icon || !textSpan) {
        console.error("Error: Icon or text span not found inside audioRecordToggle. Check your HTML structure.");
    }


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
        if (textSpan) textSpan.textContent = "Mic Not Supported";
        if (sttStatus) sttStatus.textContent = "Your browser does not support audio recording. Please update or use a modern browser.";
        console.error('MediaRecorder API not supported on this browser.');
        return; // Exit if not supported
    }

    // --- Latin to Tifinagh Mapping Function (Unchanged) ---
    function latinToTifinagh(latinText) {
        const complexMappings = {
            'kh': 'ⵅ', 'gh': 'ⵖ', 'ch': 'ⵛ', 'sh': 'ⵛ',
            'dj': 'ⴷⵊ', 'ts': 'ⵜⵙ',
            'tt': 'ⵜⵜ', 'kk': 'ⴽⴽ', 'll': 'ⵍⵍ', 'ⵏⵏ': 'nn', 'rr': 'ⵔⵔ', 'ss': 'ⵙⵙ', 'zz': 'ⵣⵣ', 'yy': 'ⵢⵢ',
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
        if (sttStatus) sttStatus.textContent = "Sending audio to backend STT...";
        if (debugOutput) debugOutput.textContent = `Sending ${audioBlob.size} bytes of audio...`;
        console.log(`Sending audio blob of size: ${audioBlob.size}`);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            const response = await fetch(STT_API_ENDPOINT, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`STT API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const transcription = data.transcription || "";
            
            if (sttStatus) sttStatus.textContent = `STT Output: "${transcription}"`;
            if (debugOutput) debugOutput.textContent = `STT Raw Output: "${transcription}"`;
            console.log("Real STT output:", transcription);
            return transcription;
            
        } catch (error) {
            console.error("Error sending audio to real STT backend:", error);
            if (sttStatus) sttStatus.textContent = "Error communicating with STT backend.";
            if (debugOutput) debugOutput.textContent = "Error: " + error.message;
            return "";
        }
    }

    // --- Helper function to reset UI state ---
    function resetUI() {
        console.log("resetUI called.");
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        if (icon) icon.className = 'fas fa-microphone';
        if (textSpan) textSpan.textContent = "Start Recording";
        audioRecordToggle.disabled = false;
        if (sttStatus) sttStatus.textContent = "Ready to record.";
        if (debugOutput) debugOutput.textContent = "";
        console.log("UI reset to 'Start Recording' state.");

        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            sendIntervalId = null;
        }
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

        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            sendIntervalId = null;
            console.log("Stopped continuous audio sending interval.");
        }

        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped.");
            });
            micStream = null;
        }

        if (sttStatus) sttStatus.textContent = "Finalizing transcription...";
        audioRecordToggle.disabled = true;

        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];
            if (audioBlob.size > 0) {
                try {
                    const finalTamazightLatinOutput = await sendAudioToRealSTT(audioBlob);
                    if (finalTamazightLatinOutput) {
                        const tifinaghOutput = latinToTifinagh(finalTamazightLatinOutput);
                        
                        let currentInputValue = keyboardInput ? keyboardInput.value : '';
                        if (lastPartialTranscription && currentInputValue.endsWith(latinToTifinagh(lastPartialTranscription))) {
                            currentInputValue = currentInputValue.slice(0, -latinToTifinagh(lastPartialTranscription).length);
                        }
                        
                        if (keyboardInput) keyboardInput.value = currentInputValue + tifinaghOutput + ' ';
                        if (keyboardInput) keyboardInput.scrollTop = keyboardInput.scrollHeight;
                        if (sttStatus) sttStatus.textContent = "Transcription complete.";
                        lastPartialTranscription = "";
                    } else {
                        if (sttStatus) sttStatus.textContent = "No speech recognized during final pass.";
                    }
                } catch (error) {
                    console.error("Error during final STT process:", error);
                    if (sttStatus) sttStatus.textContent = "Error processing final speech.";
                    if (debugOutput) debugOutput.textContent = "Error: " + error.message;
                }
            } else {
                if (sttStatus) sttStatus.textContent = "No audio recorded (too short or silent).";
                if (debugOutput) debugOutput.textContent = "No audio data was captured during the last recording.";
                console.warn("No audio data captured.");
            }
        } else {
            if (sttStatus) sttStatus.textContent = "No new audio chunks to finalize.";
        }

        resetUI();
    }

    function onMediaRecorderError(event) {
        console.error('MediaRecorder error:', event.error);
        if (sttStatus) sttStatus.textContent = `Recording error: ${event.error.name}: ${event.error.message}`;
        if (debugOutput) debugOutput.textContent = `MediaRecorder Error: ${event.error.message}`;

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
        resetUI();
    }

    // --- Function to send accumulated audio chunks to STT (for real-time) ---
    async function sendAudioChunks() {
        if (audioChunks.length === 0) {
            if (debugOutput) debugOutput.textContent = "No audio chunks to send yet.";
            return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];

        try {
            const partialTamazightLatinOutput = await sendAudioToRealSTT(audioBlob);
            
            if (partialTamazightLatinOutput) {
                const tifinaghOutput = latinToTifinagh(partialTamazightLatinOutput);

                let currentInputValue = keyboardInput ? keyboardInput.value : '';
                
                if (lastPartialTranscription) {
                    const lastPartialTifinagh = latinToTifinagh(lastPartialTranscription);
                    if (currentInputValue.endsWith(lastPartialTifinagh)) {
                        currentInputValue = currentInputValue.slice(0, -lastPartialTifinagh.length);
                    }
                }
                
                if (keyboardInput) keyboardInput.value = currentInputValue + tifinaghOutput;
                if (keyboardInput) keyboardInput.scrollTop = keyboardInput.scrollHeight;
                lastPartialTranscription = partialTamazightLatinOutput;
            } else {
                if (lastPartialTranscription) {
                    let currentInputValue = keyboardInput ? keyboardInput.value : '';
                    const lastPartialTifinagh = latinToTifinagh(lastPartialTranscription);
                    if (currentInputValue.endsWith(lastPartialTifinagh)) {
                        if (keyboardInput) keyboardInput.value = currentInputValue.slice(0, -lastPartialTifinagh.length);
                    }
                    lastPartialTranscription = "";
                }
            }
        } catch (error) {
            console.error("Error sending partial audio to STT:", error);
            if (debugOutput) debugOutput.textContent = "Error sending partial audio: " + error.message;
        }
    }


    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', async () => {
        console.log("audioRecordToggle clicked. Current isRecording state:", isRecording);

        if (!isRecording) {
            // Start Recording flow
            if (sttStatus) sttStatus.textContent = "Requesting microphone access...";
            if (debugOutput) debugOutput.textContent = "";
            console.log("Attempting to get microphone access...");
            
            // --- FIX APPLIED HERE: Disable button IMMEDIATELY before starting the async process ---
            audioRecordToggle.disabled = true; 

            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted.");

                // --- FIX APPLIED HERE: Re-enable the button promptly after mic access is granted ---
                audioRecordToggle.disabled = false; 

                mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/wav' });
                mediaRecorder.ondataavailable = onDataAvailable;
                mediaRecorder.onstop = onStop;
                mediaRecorder.onerror = onMediaRecorderError;

                mediaRecorder.start(500);
                console.log("MediaRecorder.start(500) called. State:", mediaRecorder.state);

                sendIntervalId = setInterval(sendAudioChunks, 1000);
                console.log("Started continuous audio sending interval.");

                isRecording = true;
                audioRecordToggle.classList.add('recording');
                if (icon) icon.className = 'fas fa-stop-circle';
                if (textSpan) textSpan.textContent = "Stop Recording";
                if (sttStatus) sttStatus.textContent = "Recording...";
                if (keyboardInput) keyboardInput.focus();

            } catch (err) {
                console.error('Microphone access denied or error:', err);
                if (sttStatus) sttStatus.textContent = `Microphone access denied: ${err.name}. Please check permissions.`;
                if (debugOutput) debugOutput.textContent = `Microphone Error: ${err.message}. Please enable microphone access for this site.`;
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
                if (sttStatus) sttStatus.textContent = "Stopping recording...";
                mediaRecorder.stop();
            } else {
                console.warn("Attempted to stop MediaRecorder when it was not in 'recording' state. Force resetting.");
                if (debugOutput) debugOutput.textContent = "Recorder not active. Force resetting.";
                resetUI();
            }
        }
    });

    // Initial status message
    resetUI();
});

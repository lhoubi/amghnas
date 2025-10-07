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
    let isRecording = false;
    let micStream = null; // To hold the microphone stream

    // --- Browser Compatibility Check for MediaRecorder ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audioRecordToggle.disabled = true;
        textSpan.textContent = "Mic Not Supported";
        sttStatus.textContent = "Your browser does not support audio recording. Please update or use a modern browser.";
        console.error('MediaRecorder API not supported on this browser.');
        return;
    }

    // --- Latin to Tifinagh Mapping Function (Unchanged, as this part works) ---
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

    // --- Simulate a Backend Tamazight STT Service (Unchanged) ---
    async function simulateTamazightSTT(audioBlob) {
        sttStatus.textContent = "Sending audio to backend STT (simulated)...";
        debugOutput.textContent = "Simulating STT for " + audioBlob.size + " bytes of audio...";
        console.log("Simulating STT for audio blob of size:", audioBlob.size);

        return new Promise(resolve => {
            setTimeout(() => {
                const mockResponses = [
                    "azul fellawen",
                    "manzaɣ immi",
                    "nek d Amzigh",
                    "tamaziɣt tuḍfi",
                    "axam-inu",
                    "aman iggi",
                    "afus afus",
                    "tudert n tmaziɣt",
                    "adrar n snu",
                    "ⴰⵣⵓⵍ ⴼⴻⵍⵍⴰⵡⴻⵏ", // Directly Tifinagh, to test conversion robustness
                    "azul fellam a yemma",
                    "tassawit n wawal",
                    "iẓlan imaziɣen",
                ];
                const simulatedTamazightLatin = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                sttStatus.textContent = "STT received response.";
                debugOutput.textContent = `Simulated STT Raw Output: "${simulatedTamazightLatin}"`;
                console.log("Simulated STT output:", simulatedTamazightLatin);
                resolve(simulatedTamazightLatin);
            }, 1500 + Math.random() * 1000); // Simulate network delay
        });
    }

    // --- MediaRecorder Event Handlers ---

    function onDataAvailable(event) {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
            console.log("Audio data available, chunk size:", event.data.size);
        }
    }

    async function onStop() {
        console.log("MediaRecorder onStop event fired. State:", mediaRecorder.state);

        // UI reset immediately
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
        sttStatus.textContent = "Processing audio...";

        // Stop the microphone stream tracks
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped.");
            });
            micStream = null; // Clear the stream reference
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = []; // Clear chunks for the next recording

        if (audioBlob.size > 0) {
            console.log("Audio blob created, size:", audioBlob.size);
            try {
                const tamazightLatinOutput = await simulateTamazightSTT(audioBlob);
                if (tamazightLatinOutput) {
                    const tifinaghOutput = latinToTifinagh(tamazightLatinOutput);
                    keyboardInput.value += tifinaghOutput + ' ';
                    keyboardInput.scrollTop = keyboardInput.scrollHeight;
                    sttStatus.textContent = "Transcription complete.";
                } else {
                    sttStatus.textContent = "No speech recognized by STT.";
                }
            } catch (error) {
                console.error("Error during STT process:", error);
                sttStatus.textContent = "Error processing speech.";
                debugOutput.textContent = "Error: " + error.message;
            }
        } else {
            sttStatus.textContent = "No audio recorded (too short or silent).";
            debugOutput.textContent = "No audio data was captured during the last recording.";
            console.warn("No audio data captured.");
        }
        audioRecordToggle.disabled = false; // Re-enable button after processing
    }

    function onMediaRecorderError(event) {
        console.error('MediaRecorder error:', event.error);
        sttStatus.textContent = `Recording error: ${event.error.name}: ${event.error.message}`;
        debugOutput.textContent = `MediaRecorder Error: ${event.error.message}`;

        // Ensure button state is reset on error
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
        audioRecordToggle.disabled = false; // Re-enable button

        // Stop the microphone stream tracks if an error occurred while active
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped due to error.");
            });
            micStream = null;
        }
    }

    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', () => {
        if (!isRecording) {
            // Start recording
            sttStatus.textContent = "Requesting microphone access...";
            audioRecordToggle.disabled = true; // Disable button while requesting mic to prevent double-clicks
            debugOutput.textContent = ""; // Clear previous debug messages
            console.log("Attempting to get microphone access...");

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log("Microphone access granted.");
                    micStream = stream; // Store the stream
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = onDataAvailable;
                    mediaRecorder.onstop = onStop;
                    mediaRecorder.onerror = onMediaRecorderError;

                    mediaRecorder.start(); // Start recording immediately
                    console.log("MediaRecorder.start() called.");

                    // Update UI state
                    isRecording = true;
                    audioRecordToggle.disabled = false; // Re-enable button
                    audioRecordToggle.classList.add('recording'); // This should make it red
                    icon.className = 'fas fa-stop-circle';
                    textSpan.textContent = "Stop Recording";
                    sttStatus.textContent = "Recording...";
                    keyboardInput.focus();
                })
                .catch(err => {
                    console.error('Microphone access denied or error:', err);
                    sttStatus.textContent = `Microphone access denied: ${err.name}. Please check permissions.`;
                    debugOutput.textContent = `Microphone Error: ${err.message}. Please enable microphone access for this site.`;
                    audioRecordToggle.disabled = false; // Re-enable so user can try again
                    textSpan.textContent = "Mic Denied";
                    audioRecordToggle.classList.remove('recording');
                    icon.className = 'fas fa-microphone';
                });
        } else {
            // Stop recording
            console.log("Stop button clicked. MediaRecorder state:", mediaRecorder ? mediaRecorder.state : 'undefined');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                audioRecordToggle.disabled = true; // Disable button briefly while processing
                sttStatus.textContent = "Stopping recording...";
            } else {
                console.warn("Attempted to stop MediaRecorder when it was not active. Resetting state.");
                // This block should ideally not be hit if `isRecording` is managed correctly
                isRecording = false;
                audioRecordToggle.classList.remove('recording');
                icon.className = 'fas fa-microphone';
                textSpan.textContent = "Start Recording";
                sttStatus.textContent = "Recording unexpectedly stopped. Click to restart.";
                audioRecordToggle.disabled = false;
                 if (micStream) {
                    micStream.getTracks().forEach(track => track.stop());
                    micStream = null;
                }
            }
        }
    });

    // Initial status message
    sttStatus.textContent = "Click 'Start Recording' to begin.";
});

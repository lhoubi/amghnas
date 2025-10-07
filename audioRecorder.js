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

    // --- Browser Compatibility Check for MediaRecorder ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audioRecordToggle.disabled = true;
        textSpan.textContent = "Mic Not Supported";
        sttStatus.textContent = "Your browser does not support audio recording. Please update or use a modern browser.";
        console.error('MediaRecorder API not supported on this browser.');
        return; // Exit if not supported
    }

    // --- Latin to Tifinagh Mapping Function (Unchanged) ---
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
                    "azul fellawen", "manzaɣ immi", "nek d Amzigh", "tamaziɣt tuḍfi", "axam-inu",
                    "aman iggi", "afus afus", "tudert n tmaziɣt", "adrar n snu", "ⴰⵣⵓⵍ ⴼⴻⵍⵍⴰⵡⴻⵏ",
                    "azul fellam a yemma", "tassawit n wawal", "iẓlan imaziɣen",
                ];
                const simulatedTamazightLatin = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                sttStatus.textContent = "STT received response.";
                debugOutput.textContent = `Simulated STT Raw Output: "${simulatedTamazightLatin}"`;
                console.log("Simulated STT output:", simulatedTamazightLatin);
                resolve(simulatedTamazightLatin);
            }, 1500 + Math.random() * 1000);
        });
    }

    // --- Helper function to reset UI state ---
    function resetUI() {
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
        audioRecordToggle.disabled = false; // Ensure button is re-enabled
        sttStatus.textContent = "Click 'Start Recording' to begin.";
        debugOutput.textContent = ""; // Clear debug on reset
        console.log("UI reset to 'Start Recording' state.");
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

        // Stop all tracks in the stream
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped.");
            });
            micStream = null;
        }

        sttStatus.textContent = "Processing audio...";
        audioRecordToggle.disabled = true; // Disable during processing

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = []; // Clear chunks for next recording

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
        resetUI(); // Always reset UI after recording stops or processing finishes
    }

    function onMediaRecorderError(event) {
        console.error('MediaRecorder error:', event.error);
        sttStatus.textContent = `Recording error: ${event.error.name}: ${event.error.message}`;
        debugOutput.textContent = `MediaRecorder Error: ${event.error.message}`;

        // Stop all tracks in the stream
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Microphone track stopped due to error.");
            });
            micStream = null;
        }
        resetUI(); // Reset UI on error
    }

    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', async () => { // Made async for getUserMedia await
        if (!isRecording) {
            // Start Recording flow
            sttStatus.textContent = "Requesting microphone access...";
            debugOutput.textContent = "";
            console.log("Attempting to get microphone access...");
            audioRecordToggle.disabled = true; // Disable button *while* async mic request is pending

            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Microphone access granted.");

                mediaRecorder = new MediaRecorder(micStream);
                mediaRecorder.ondataavailable = onDataAvailable;
                mediaRecorder.onstop = onStop;
                mediaRecorder.onerror = onMediaRecorderError;

                mediaRecorder.start();
                console.log("MediaRecorder.start() called. State:", mediaRecorder.state);

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
            if (mediaRecorder && mediaRecorder.state === 'recording') { // Ensure it's actually recording
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
    resetUI(); // Set initial state
});

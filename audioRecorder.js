// audioRecorder.js

document.addEventListener('DOMContentLoaded', () => {
    const audioRecordToggle = document.getElementById('audioRecordToggle');
    const keyboardInput = document.getElementById('keyboardInput');
    const icon = audioRecordToggle.querySelector('i');
    const textSpan = audioRecordToggle.querySelector('span');
    const sttStatus = document.getElementById('sttStatus');
    const debugOutput = document.getElementById('debugOutput'); // For debugging STT output

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // --- Browser Compatibility Check for MediaRecorder ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        audioRecordToggle.disabled = true;
        textSpan.textContent = "MediaRecorder Not Supported";
        sttStatus.textContent = "Your browser does not support audio recording. Please update or use a different browser.";
        console.error('MediaRecorder API not supported on this browser.');
        return;
    }

    // --- Latin to Tifinagh Mapping Function ---
    function latinToTifinagh(latinText) {
        // This mapping is designed to be comprehensive for common Tamazight Latin transcription.
        // Prioritize longer, specific mappings first to avoid partial matches (e.g., 'kh' before 'k').
        const complexMappings = {
            // Tamazight-specific digraphs/trigraphs (Longest sequences first)
            'kh': 'ⵅ', 'gh': 'ⵖ', 'ch': 'ⵛ', 'sh': 'ⵛ', // x, ɣ, č
            'dj': 'ⴷⵊ', // or ⵊ if a single phoneme in dialect, but ⴷⵊ is more general
            'ts': 'ⵜⵙ',
            'tt': 'ⵜⵜ', 'kk': 'ⴽⴽ', 'll': 'ⵍⵍ', 'nn': 'ⵏⵏ', 'rr': 'ⵔⵔ', 'ss': 'ⵙⵙ', 'zz': 'ⵣⵣ', 'yy': 'ⵢⵢ', // Gemination

            // Emphatic consonants (crucial for Tamazight phonology)
            // It is assumed the input latinText will use these specific characters if emphatic.
            'ḍ': 'ⴹ', 'ṭ': 'ⵟ', 'ṣ': 'ⵚ', 'ẓ': 'ⵥ', 'ṛ': 'ⵕ',

            // Labialization mark (ʷ)
            // 'w' for simple /w/ sound, 'ⵯ' for labialization after a consonant.
            // If the STT outputs 'tw', and you want 'ⵜⵯ', you'd need 'tw': 'ⵜⵯ' mapping.
            // For general 'w' mapping, it goes to 'ⵡ'. Your 'ـ' mapping to 'ⵯ' is good for manual input.
            'w': 'ⵡ',

            // Basic vowels
            'a': 'ⴰ', 'e': 'ⴻ', 'i': 'ⵉ', 'o': 'ⵓ', 'u': 'ⵓ', // 'o' and 'u' often map to 'ⵓ'

            // Basic consonants
            'b': 'ⴱ', 'd': 'ⴷ', 'f': 'ⴼ', 'g': 'ⴳ', 'h': 'ⵀ',
            'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
            'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', 's': 'ⵙ',
            't': 'ⵜ', 'v': 'ⵠ', 'y': 'ⵢ', 'z': 'ⵣ',
            'c': 'ⵄ', // For 'ع' (Ayin) sound, 'c' is often used in some transcription systems

            // Specific characters often used in academic Latin Tamazight transcription
            'ɣ': 'ⵖ', // Latin gamma for gh
            'ḥ': 'ⵃ', // Latin h-dot for ḥ
            'ɛ': 'ⵄ', // Latin epsilon for Ayin
            'č': 'ⵛ', // Latin c-caron for ch/sh

            // Arabic characters (if STT might output Arabic or user inputs Arabic)
            'ا': 'ⴰ', 'ب': 'ⴱ', 'د': 'ⴷ', 'ض': 'ⴹ', 'ف': 'ⴼ',
            'ڭ': 'ⴳ', 'ه': 'ⵀ', 'ح': 'ⵃ', 'إ': 'ⵉ', 'ج': 'ⵊ',
            'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ', 'پ': 'ⵒ',
            'ق': 'ⵇ', 'ر': 'ⵔ', 'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ',
            'ت': 'ⵜ', 'ط': 'ⵟ', 'أُ': 'ⵓ', 'ڤ': 'ⵠ', 'و': 'ⵡ',
            'خ': 'ⵅ', 'ي': 'ⵢ', 'ز': 'ⵣ', 'ـ': 'ⵯ', 'ع': 'ⵄ',

            // Common punctuation and space
            ' ': ' ', '.': '.', ',': ',', '?': '?', '!': '!',
            '-': '-', '\'': '\'', '"': '"', '(': '(', ')': ')',
            '؟': '?', '،': ',', // Arabic punctuation
        };

        let tifinaghText = '';
        let i = 0;
        const lowerLatin = latinText.toLowerCase(); // Work with lowercase for mapping logic

        while (i < lowerLatin.length) {
            let matched = false;

            // Attempt to match longest possible sequence first (e.g., 'kh' before 'k')
            // Can increase '3' if there are 4-character sequences in your mappings.
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
                // If no multi-character or exact single-character match,
                // try mapping a single character, potentially stripping diacritics as a fallback.
                const char = lowerLatin[i]; // Original character at current position

                if (complexMappings[char]) { // Check if original character (e.g., 'ḍ') is mapped
                    tifinaghText += complexMappings[char];
                    i++;
                    matched = true;
                } else {
                    // Fallback: strip diacritics and try to map (e.g., 'á' -> 'a' -> 'ⴰ')
                    const charWithoutDiacritic = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (complexMappings[charWithoutDiacritic]) {
                         tifinaghText += complexMappings[charWithoutDiacritic];
                         i++;
                         matched = true;
                    } else {
                         // If still no mapping, append the original character.
                         // This handles numbers, unmapped symbols, or characters not in Tamazight.
                         tifinaghText += latinText[i]; // Use original case for unmatched character
                         i++;
                    }
                }
            }
        }
        return tifinaghText;
    }

    // --- Simulate a Backend Tamazight STT Service ---
    // In a real application, you would send the audioBlob to your server,
    // which would then call a Tamazight-capable STT API (e.g., Google Cloud Speech-to-Text
    // with a custom model, or a specialized provider).
    // This function provides dummy, common Tamazight phrases in Latin transcription.
    async function simulateTamazightSTT(audioBlob) {
        sttStatus.textContent = "Sending audio to backend STT (simulated)...";
        debugOutput.textContent = "Simulating STT for " + audioBlob.size + " bytes of audio...";

        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate various responses based on typical input lengths or just random selection
                const mockResponses = [
                    "azul fellawen", // Hello everyone
                    "manzaɣ immi", // How are you?
                    "nek d Amzigh", // I am Amazigh
                    "tamaziɣt tuḍfi", // Tamazight is beautiful
                    "axam-inu", // My house
                    "aman iggi", // Water, mountain
                    "afus afus", // Hand in hand
                    "tudert n tmaziɣt", // The life of Tamazight
                    "adrar n snu", // Mount snu
                    "ⴰⵣⵓⵍ ⴼⴻⵍⵍⴰⵡⴻⵏ", // Directly Tifinagh, to test conversion robustness
                    "azul fellam a yemma", // Hello mother (with complex sounds)
                    "tassawit n wawal", // Speech recognition
                    "iẓlan imaziɣen", // Amazigh songs (with emphatic ẓ)
                ];

                // Select a random phrase to simulate different STT outputs
                const simulatedTamazightLatin = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                sttStatus.textContent = "STT received response.";
                debugOutput.textContent = `Simulated STT Raw Output: "${simulatedTamazightLatin}"`;
                resolve(simulatedTamazightLatin);
            }, 1500 + Math.random() * 1000); // Simulate network delay
        });
    }

    // --- MediaRecorder Event Handlers ---

    // When audio data is available
    function onDataAvailable(event) {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    }

    // When recording stops
    async function onStop() {
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
        sttStatus.textContent = "Processing audio...";
        console.log("MediaRecorder stopped.");

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Use webm for broad support
        audioChunks = []; // Clear chunks for the next recording

        if (audioBlob.size > 0) {
            try {
                const tamazightLatinOutput = await simulateTamazightSTT(audioBlob); // Call your simulated/real STT
                if (tamazightLatinOutput) {
                    const tifinaghOutput = latinToTifinagh(tamazightLatinOutput);
                    keyboardInput.value += tifinaghOutput + ' ';
                    keyboardInput.scrollTop = keyboardInput.scrollHeight; // Scroll to bottom
                    sttStatus.textContent = "Transcription complete.";
                } else {
                    sttStatus.textContent = "No speech recognized.";
                }
            } catch (error) {
                console.error("Error during STT process:", error);
                sttStatus.textContent = "Error processing speech.";
                debugOutput.textContent = "Error: " + error.message;
            }
        } else {
            sttStatus.textContent = "No audio recorded.";
            debugOutput.textContent = "No audio data was captured.";
        }
    }

    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', () => {
        if (!isRecording) {
            // Start recording
            sttStatus.textContent = "Requesting microphone access...";
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = onDataAvailable;
                    mediaRecorder.onstop = onStop;
                    mediaRecorder.onerror = (event) => {
                        console.error('MediaRecorder error:', event.error);
                        sttStatus.textContent = `Recording error: ${event.error.name}`;
                        debugOutput.textContent = `MediaRecorder Error: ${event.error.message}`;
                        // Reset UI if error occurs during recording
                        isRecording = false;
                        audioRecordToggle.classList.remove('recording');
                        icon.className = 'fas fa-microphone';
                        textSpan.textContent = "Start Recording";
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    audioRecordToggle.classList.add('recording');
                    icon.className = 'fas fa-stop-circle'; // Stop icon
                    textSpan.textContent = "Stop Recording";
                    sttStatus.textContent = "Recording...";
                    debugOutput.textContent = ""; // Clear debug on new recording
                    console.log("MediaRecorder started...");
                    keyboardInput.focus(); // Ensure textarea is focused

                    // Stop microphone stream after use (important for privacy/performance)
                    // The stream is passed to MediaRecorder, which handles it.
                    // We only need to stop the tracks if we're done with the stream entirely,
                    // or if we want to turn off the mic indicator immediately after stop.
                    // For now, let it be handled implicitly by MediaRecorder.
                })
                .catch(err => {
                    console.error('Microphone access denied or error:', err);
                    sttStatus.textContent = `Microphone access denied: ${err.name}`;
                    debugOutput.textContent = `Microphone Error: ${err.message}. Please allow microphone access.`;
                    audioRecordToggle.disabled = true; // Disable button if no mic access
                    textSpan.textContent = "Mic Denied";
                });
        } else {
            // Stop recording
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        }
    });

    // Initial status message
    sttStatus.textContent = "Click 'Start Recording' to begin.";
});

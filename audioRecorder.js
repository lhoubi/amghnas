// audioRecorder.js

document.addEventListener('DOMContentLoaded', () => {
    const audioRecordToggle = document.getElementById('audioRecordToggle');
    const keyboardInput = document.getElementById('keyboardInput');
    const icon = audioRecordToggle.querySelector('i');
    const textSpan = audioRecordToggle.querySelector('span');

    let recognition; // Will store the SpeechRecognition object
    let isRecording = false; // Tracks if recognition is active

    // --- Browser Compatibility Check for SpeechRecognition ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        audioRecordToggle.disabled = true;
        textSpan.textContent = "Speech Not Supported";
        console.error('Web Speech API (SpeechRecognition) not supported on this browser.');
        alert('Your browser does not support the Web Speech API. Please try Chrome or Edge for real-time transcription.');
        return;
    }

    // --- Initialize SpeechRecognition ---
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening even if user pauses
    recognition.interimResults = false; // Set to false to only get final results, or true if you want to show interim.
                                       // For appending directly to textarea, final results are cleaner.
    // !!! IMPORTANT: Set to the most appropriate language tag.
    // There is NO standard 'ber' or Tifinagh language code for SpeechRecognition.
    // You will likely need to test different codes. 'fr-FR' or 'ar-MA' (Moroccan Arabic)
    // might give *some* results if your Berber dialect is close or you speak those languages.
    // For direct Berber, a custom backend STT solution is necessary.
    recognition.lang = 'fr-FR'; // Example: French. Try 'ar-MA' or 'en-US' if more relevant.

    // --- SpeechRecognition Event Handlers ---

    // When a partial or final result is received
    recognition.onresult = (event) => {
        let finalTranscript = ''; // This will accumulate all final results since the last `start()`

        // Loop through all results from the event
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            // Only process final results if interimResults is false, or append final ones.
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            }
        }

        if (finalTranscript) {
            console.log("SpeechRecognition detected (Latin/raw):", finalTranscript);
            // Convert the detected Latin (or raw) text to Tifinagh
            const tifinaghOutput = latinToTifinagh(finalTranscript);

            // Append the converted Tifinagh text to the textarea
            keyboardInput.value += tifinaghOutput + ' '; // Add a space for readability
            keyboardInput.scrollTop = keyboardInput.scrollHeight; // Scroll to bottom
        }
    };

    // When the speech recognition service starts listening
    recognition.onstart = () => {
        isRecording = true;
        audioRecordToggle.classList.add('recording');
        icon.className = 'fas fa-stop-circle'; // Stop icon
        textSpan.textContent = "Stop Recording";
        console.log("Speech recognition started...");
        keyboardInput.focus(); // Ensure textarea is focused
        keyboardInput.value += ''; // Add an empty string to potentially trigger focus visual if needed
    };

    // When the speech recognition service stops listening (either by user or timeout)
    recognition.onend = () => {
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone'; // Microphone icon
        textSpan.textContent = "Start Recording";
        console.log("Speech recognition ended.");
        // If continuous is true, onend usually means it timed out briefly.
        // If you want it to restart automatically after a pause, you'd call recognition.start() here
        // but be careful not to create an infinite loop if the user genuinely wants to stop.
    };

    // Handle errors (e.g., microphone permission denied, no speech detected)
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please enable microphone access for this site.');
        } else if (event.error === 'no-speech') {
            console.warn("No speech detected. Recognition automatically stopped.");
            // You might want to remove the last word/space if it was an interim result that didn't finalize.
            // For now, we just log.
        } else if (event.error === 'network') {
            alert('Network error during speech recognition. Please check your connection.');
        }
        // Always reset button state on error
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        textSpan.textContent = "Start Recording";
    };

    // --- Toggle Button Click Handler ---
    audioRecordToggle.addEventListener('click', () => {
        if (!isRecording) {
            // Start recording
            try {
                // Clear the textarea only when a *new* recording session starts if desired,
                // or just append. Based on your request, we append.
                recognition.start();
            } catch (e) {
                console.error("Error starting speech recognition:", e);
                // This catch handles cases where start() is called when already active,
                // or if there's an immediate browser error (e.g., already started).
            }
        } else {
            // Stop recording
            recognition.stop();
        }
    });

    // --- Latin to Tifinagh Mapping Function (CRITICAL FOR YOUR REQUEST) ---
    // This is a basic, direct character-to-character mapping.
    // For good results with Berber/Tifinagh, this needs to be far more sophisticated:
    // - Handle digraphs (e.g., 'kh' -> 'ⵅ', 'gh' -> 'ⵖ', 'sh' -> 'ⵛ') before single characters.
    // - Handle context-sensitive variations if applicable.
    // - Potentially use a more advanced transliteration library or lookup table.
    function latinToTifinagh(latinText) {
        // Pre-process common Latin representations that map to a single Tifinagh character
        const complexMappings = {
            'kh': 'ⵅ', 'gh': 'ⵖ', 'ch': 'ⵛ', 'sh': 'ⵛ', // Digraphs
            'ṛ': 'ⵕ', // Ṛ for Ṛ (emphatic R)
            'ḍ': 'ⴹ', // Ḍ for Ḍ (emphatic D)
            'ṭ': 'ⵟ', // Ṭ for Ṭ (emphatic T)
            'ṣ': 'ⵚ', // Ṣ for Ṣ (emphatic S)
            'ẓ': 'ⵥ', // Ẓ for Ẓ (emphatic Z)
            'a': 'ⴰ', 'b': 'ⴱ', 'd': 'ⴷ', 'e': 'ⴻ',
            'f': 'ⴼ', 'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ',
            'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
            'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', 's': 'ⵙ',
            't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
            'y': 'ⵢ', 'z': 'ⵣ', 'c': 'ⵄ', // Your keyboard maps 'A' to 'ⵄ', let's also map 'c'

            // Arabic characters from your keyboard layout's data-arabic-key for robust conversion
            'ا': 'ⴰ', 'ب': 'ⴱ', 'د': 'ⴷ', 'ض': 'ⴹ', 'ف': 'ⴼ',
            'ڭ': 'ⴳ', 'ه': 'ⵀ', 'ح': 'ⵃ', 'إ': 'ⵉ', 'ج': 'ⵊ',
            'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ', 'پ': 'ⵒ',
            'ق': 'ⵇ', 'ر': 'ⵔ', 'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ',
            'ت': 'ⵜ', 'ط': 'ⵟ', 'أُ': 'ⵓ', 'ڤ': 'ⵠ', 'و': 'ⵡ',
            'خ': 'ⵅ', 'ي': 'ⵢ', 'ز': 'ⵣ', 'ـ': 'ⵯ', 'ع': 'ⵄ',

            // Common punctuation and space
            ' ': ' ', '.': '.', ',': ',', '?': '?', '!': '!',
            '-': '-', '\'': '\'', '"': '"', '(': '(', ')': ')',
        };

        let tifinaghText = '';
        let i = 0;
        const lowerLatin = latinText.toLowerCase();

        while (i < lowerLatin.length) {
            let matched = false;

            // Try to match longest possible Latin sequence first (e.g., 'kh' before 'k')
            // Check for 3-char, then 2-char, then 1-char
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
                // If no direct mapping found, try matching with diacritics stripped
                // This is a very basic attempt and might not be linguistically sound
                const charWithoutDiacritic = lowerLatin[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (complexMappings[charWithoutDiacritic]) {
                     tifinaghText += complexMappings[charWithoutDiacritic];
                     i++;
                     matched = true;
                } else {
                     // If still no mapping, append the original character
                     tifinaghText += latinText[i]; // Use original case for unmatched
                     i++;
                }
            }
        }
        return tifinaghText;
    }
});

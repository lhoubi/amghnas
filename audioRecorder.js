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
        // Optionally, inform the user about the lack of support.
        // alert('Your browser does not support the Web Speech API. Please try Chrome or Edge for real-time transcription.');
        return;
    }

    // --- Initialize SpeechRecognition ---
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening even if user pauses
    recognition.interimResults = true; // Get results as user speaks (partial results)
    recognition.lang = 'fr-FR'; // !!! IMPORTANT: Set to a language that your browser might support for Berber/Arabic.
                                // There is NO standard 'ber' or Tifinagh language code for SpeechRecognition.
                                // You might try 'ar-MA' for Moroccan Arabic or 'fr-FR'/'en-US' if Berber speech is close
                                // to one of those and then apply a Latin-to-Tifinagh conversion.
                                // You will likely get poor results for direct Berber.
                                // A custom backend STT solution is needed for accurate Berber.

    // --- SpeechRecognition Event Handlers ---

    // When a partial or final result is received
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // We want to update the textarea with Tifinagh characters.
        // Since SpeechRecognition likely outputs Latin, we need a conversion.
        // IMPORTANT: This 'latinToTifinagh' function needs to be robust for good results.
        if (finalTranscript) {
            const tifinaghOutput = latinToTifinagh(finalTranscript);
            // Append final recognized text (Tifinagh) to the textarea
            keyboardInput.value += tifinaghOutput + ' ';
            keyboardInput.scrollTop = keyboardInput.scrollHeight; // Scroll to bottom
        }
        // You could also display interimTranscript somewhere else, e.g., a temporary display area
        // if you want to show Latin interim results before final Tifinagh conversion.
        // console.log("Interim:", interimTranscript);
        // console.log("Final:", finalTranscript);
    };

    // When the speech recognition service starts listening
    recognition.onstart = () => {
        isRecording = true;
        audioRecordToggle.classList.add('recording');
        icon.className = 'fas fa-stop-circle'; // Stop icon
        textSpan.textContent = "Stop Recording";
        console.log("Speech recognition started...");
        keyboardInput.focus(); // Ensure textarea is focused
    };

    // When the speech recognition service stops listening (either by user or timeout)
    recognition.onend = () => {
        isRecording = false;
        audioRecordToggle.classList.remove('recording');
        icon.className = 'fas fa-microphone'; // Microphone icon
        textSpan.textContent = "Start Recording";
        console.log("Speech recognition ended.");
        // If it stopped unexpectedly and should be continuous, you might restart here.
        // For this implementation, we assume `onend` means user explicitly stopped or timeout happened.
    };

    // Handle errors (e.g., microphone permission denied, no speech detected)
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please enable microphone access for this site.');
        } else if (event.error === 'no-speech') {
            // Optional: User didn't speak, recognition timed out
            console.warn("No speech detected. Recognition automatically stopped.");
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
                recognition.start();
            } catch (e) {
                console.error("Error starting speech recognition:", e);
                // This catch handles cases where start() is called when already active,
                // or if there's an immediate browser error.
                // onstart/onerror handlers will typically manage the UI.
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
        const mapping = {
            'a': 'ⴰ', 'b': 'ⴱ', 'd': 'ⴷ', 'ḍ': 'ⴹ', 'e': 'ⴻ',
            'f': 'ⴼ', 'g': 'ⴳ', 'h': 'ⵀ', 'ḥ': 'ⵃ', 'i': 'ⵉ',
            'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
            'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', 'ṛ': 'ⵕ', 's': 'ⵙ',
            't': 'ⵜ', 'ṭ': 'ⵟ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
            'y': 'ⵢ', 'z': 'ⵣ', 'ẓ': 'ⵥ', 'ⵄ': 'ⵄ', // Your keyboard has a Latin 'A' for 'ⵄ'
            // Special characters and digraphs - order matters! Match longest first.
            'kh': 'ⵅ', // Khā
            'gh': 'ⵖ', // Ghayn
            'ch': 'ⵛ', // Shīn
            'sh': 'ⵛ', // Alternative for Shīn
            'rr': 'ⵕ', // Common for emphatic R
            'tt': 'ⵜⵜ', // Gemination example (may not be direct char map)
            'll': 'ⵍⵍ', // Gemination example
            'nn': 'ⵏⵏ', // Gemination example
            'bʷ': 'ⴱⵯ', 'dʷ': 'ⴷⵯ', // Labialized consonants (example, might not be direct)

            // Punctuation and space
            ' ': ' ', '.': '.', ',': ',', '?': '?', '!': '!',
            '-': '-', '\'': '\'', '"': '"', '(': '(', ')': ')',

            // Add other specific mappings based on your desired transliteration standard
            // Example for Arabic letters that might appear if 'ar' language is used
            'ا': 'ⴰ', 'ب': 'ⴱ', 'د': 'ⴷ', 'ض': 'ⴹ', 'ف': 'ⴼ',
            'ج': 'ⵊ', 'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
            'ق': 'ⵇ', 'ر': 'ⵔ', 'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ',
            'ت': 'ⵜ', 'ط': 'ⵟ', 'و': 'ⵡ', 'خ': 'ⵅ', 'ي': 'ⵢ',
            'ز': 'ⵣ', 'ع': 'ⵄ', 'ه': 'ⵀ', 'ح': 'ⵃ', 'إ': 'ⵉ',
            'أُ': 'ⵓ', 'ڤ': 'ⵠ', 'پ': 'ⵒ', 'ـ': 'ⵯ', // Arabic equivalents from your keyboard data

            // Ensure uppercase Latin are also handled
            'A': 'ⴰ', 'B': 'ⴱ', 'D': 'ⴷ', 'Ḍ': 'ⴹ', 'E': 'ⴻ',
            'F': 'ⴼ', 'G': 'ⴳ', 'H': 'ⵀ', 'Ḥ': 'ⵃ', 'I': 'ⵉ',
            'J': 'ⵊ', 'K': 'ⴽ', 'L': 'ⵍ', 'M': 'ⵎ', 'N': 'ⵏ',
            'P': 'ⵒ', 'Q': 'ⵇ', 'R': 'ⵔ', 'Ṛ': 'ⵕ', 'S': 'ⵙ',
            'T': 'ⵜ', 'Ṭ': 'ⵟ', 'U': 'ⵓ', 'V': 'ⵠ', 'W': 'ⵡ',
            'Y': 'ⵢ', 'Z': 'ⵣ', 'Ẓ': 'ⵥ', 'C': 'ⵛ', // From your keyboard data

            // Make sure the Arabic equivalents from your keyboard layout are also mapped if latinToTifinagh is called on them
            // Example: "ا" for "ⴰ" and "ب" for "ⴱ" are already handled above.
        };

        let tifinaghText = '';
        let i = 0;
        const lowerLatin = latinText.toLowerCase(); // Convert to lowercase for consistent matching

        while (i < lowerLatin.length) {
            let matched = false;

            // Try to match longest sequences first (e.g., 'kh' before 'k')
            for (let len = 3; len >= 1; len--) { // Check 3-char, then 2-char, then 1-char
                if (i + len <= lowerLatin.length) {
                    const segment = lowerLatin.substring(i, i + len);
                    if (mapping[segment]) {
                        tifinaghText += mapping[segment];
                        i += len;
                        matched = true;
                        break;
                    }
                }
            }

            if (!matched) {
                // If no mapping found, append the original character (or a placeholder)
                tifinaghText += latinText[i]; // Use original case for unmatched
                i++;
            }
        }
        return tifinaghText;
    }
});

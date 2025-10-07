document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return;
    }

    // --- Tifinagh Mapping (for Latin input) ---
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ',
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ', // Space key
        '\n': '\n' // Enter key (newline)
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for Latin input) ---
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
    };

    // --- Arabic to Tifinagh Mapping ---
    // Adjusted some mappings for better common use
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', // Alef variations
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⴳ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ', // ض often ⴹ
        'ط': 'ⵟ', 'ظ': 'ⵥ', // ظ often ⵥ or ⴹ depending on dialect
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', 'ى': 'ⵉ', // Taa marbuta to E, Alef maqsuura to I
        'ء': 'ⴻ', // Hamza can be mapped to ⴻ or empty, chose ⴻ for consistency
        'ؤ': 'ⵓ', 'ئ': 'ⵉ', // Hamza on waw/yaa to U/I

        // Punctuation and special characters
        ' ': ' ', // Space
        '\n': '\n', // Newline
        'ـ': 'ـ', // Tatweel as a hyphen/elongation for Tifinagh 'ـ'
        // Add common punctuation if you want them specifically mapped
        // ',': ',', '.': '.', ';': ';', '/': '/', '?': '?', '!': '!', '(': '(', ')': ')',
        // Common ligatures or combined characters that might be typed in Arabic and need a Tifinagh equivalent
        'لا': 'ⵍⴰ', // lam-alef
        'لأ': 'ⵍⴰ',
        'لإ': 'ⵍⵉ',
        'لآ': 'ⵍⴰ'
    };

    // --- Mapping to highlight the correct virtual key based on the Tifinagh character inserted ---
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', 'ـ': 'ـ', // Tatweel
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace' // Keep special keys
    };

    // Function to highlight a virtual key temporarily
    // It takes the Tifinagh character that was *inserted* into the textarea.
    function highlightKey(tifinaghChar) {
        if (!tifinaghChar) return;

        const virtualKeyData = tifinaghCharToVirtualKeyMap[tifinaghChar];
        if (virtualKeyData) {
            const matchingKey = document.querySelector(`.keyboard-key[data-key="${virtualKeyData}"]`);
            if (matchingKey) {
                matchingKey.classList.add('active');
                setTimeout(() => {
                    matchingKey.classList.remove('active');
                }, 150);
            }
        }
    }

    // --- Helper to detect if a character is Arabic ---
    function isArabicChar(char) {
        if (!char) return false;
        // Basic Arabic script range
        return char.match(/[\u0600-\u06FF]/);
    }

    // --- Helper to detect if a character is Latin ---
    function isLatinChar(char) {
        if (!char) return false;
        return char.match(/[a-zA-Z]/);
    }

    // --- Helper to get the last character typed from a change in value ---
    function getLastInputCharacter(oldValue, newValue, newCursorPos) {
        if (newValue.length > oldValue.length) {
            // A character was added
            const addedText = newValue.substring(oldValue.length);
            return addedText.length === 1 ? addedText : null; // Return if single char added
        }
        return null;
    }

    // --- Core Conversion Logic for Physical Keyboard Input ---
    // This function processes a *single* input character (Latin or Arabic)
    // and returns its Tifinagh equivalent and the Tifinagh char itself for highlighting.
    function convertSingleCharToTifinagh(inputChar) {
        let tifinaghEquivalent = inputChar; // Default: keep as is
        let charForHighlight = inputChar; // Default for highlight

        if (isLatinChar(inputChar)) {
            // Try digraphs first (physical typing can't easily do digraphs unless complex logic)
            // For single char, focus on direct map
            let mappedChar = tifinaghShiftMap[inputChar];
            if (!mappedChar) {
                mappedChar = tifinaghMap[inputChar.toLowerCase()];
            }
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
                charForHighlight = mappedChar;
            }
        } else if (isArabicChar(inputChar)) {
            const mappedChar = arabicToTifinaghMap[inputChar];
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
                charForHighlight = mappedChar;
            }
        }
        // If it's a space or newline, ensure it maps to itself and highlights correctly
        if (inputChar === ' ') {
            tifinaghEquivalent = ' ';
            charForHighlight = ' ';
        } else if (inputChar === '\n') {
            tifinaghEquivalent = '\n';
            charForHighlight = '\n'; // For highlight purposes
        }

        return { convertedChar: tifinaghEquivalent, charForHighlight: charForHighlight };
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            let newValue = keyboardInput.value;
            let newCursorPos = start;

            const keyValue = key.dataset.key; // Tifinagh char, or ' ' or 'backspace'
            let charForHighlight = keyValue;

            if (keyValue === 'backspace') {
                if (start === end) { // No text selected, delete preceding character
                    if (start > 0) {
                        newValue = newValue.substring(0, start - 1) + newValue.substring(end);
                        newCursorPos = start - 1;
                    }
                } else { // Text is selected, delete selected text
                    newValue = newValue.substring(0, start) + newValue.substring(end);
                    newCursorPos = start;
                }
                charForHighlight = 'backspace'; // Special value for backspace highlight
            } else {
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
            }

            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();

            highlightKey(charForHighlight); // Highlight the Tifinagh key that was conceptually pressed/inserted
        });
    });


    // --- Real-time Conversion on Physical Keyboard Input ---
    let previousValue = ''; // To track changes for physical keyboard input
    let ignoreNextInput = false; // Flag to prevent re-entrancy during our own updates

    function processPhysicalInput() {
        if (ignoreNextInput) return;

        const currentInput = keyboardInput.value;
        const currentCursorPos = keyboardInput.selectionStart;

        // If content was selected and replaced, or a backspace/delete occurred
        if (currentInput.length < previousValue.length && currentCursorPos <= previousValue.length) {
            // It was a deletion (backspace or selection deletion)
            highlightKey('backspace'); // Highlight backspace
            previousValue = currentInput;
            return;
        }

        // Determine what was *just typed* on the physical keyboard
        const newlyTypedChar = getLastInputCharacter(previousValue, currentInput, currentCursorPos);

        if (newlyTypedChar) {
            const { convertedChar, charForHighlight } = convertSingleCharToTifinagh(newlyTypedChar);

            if (convertedChar !== newlyTypedChar) { // If a conversion actually happened
                ignoreNextInput = true; // Prevent re-triggering 'input' event

                const beforeCursor = currentInput.substring(0, currentCursorPos - newlyTypedChar.length);
                const afterCursor = currentInput.substring(currentCursorPos);

                keyboardInput.value = beforeCursor + convertedChar + afterCursor;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = beforeCursor.length + convertedChar.length;

                ignoreNextInput = false; // Reset flag
                highlightKey(charForHighlight); // Highlight the Tifinagh result
            } else {
                // No conversion, just a regular character (e.g., punctuation, numbers)
                // We can still try to highlight it if it happens to match a Tifinagh key
                highlightKey(newlyTypedChar); // Try to highlight the literal char if it matches
            }
        } else if (currentInput !== previousValue && !newlyTypedChar) {
            // This case handles pasting, or complex input where a single char couldn't be isolated.
            // For simplicity, we'll re-process the whole string for conversion here.
            // This might not give perfect per-char highlight, but ensures conversion.
            const { text: convertedText, cursorPos: newPos } = convertMixedInputToTifinagh(currentInput, currentCursorPos);
            if (keyboardInput.value !== convertedText) {
                ignoreNextInput = true;
                keyboardInput.value = convertedText;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = newPos;
                ignoreNextInput = false;
            }
            // Cannot reliably highlight a single key for a multi-character paste/complex input
        }

        previousValue = keyboardInput.value; // Update previousValue for the next input event
    }

    // Helper to convert an entire string that might contain mixed Latin/Arabic/Tifinagh
    // This is used as a fallback for complex inputs like pasting.
    function convertMixedInputToTifinagh(inputText, originalCursorPos) {
        let result = '';
        let currentIdx = 0;
        let newCursorPos = 0;

        while (currentIdx < inputText.length) {
            const char = inputText[currentIdx];
            const { convertedChar } = convertSingleCharToTifinagh(char); // Use our single char converter
            result += convertedChar;
            if (currentIdx < originalCursorPos) {
                newCursorPos += convertedChar.length;
            }
            currentIdx++;
        }
        return { text: result, cursorPos: newCursorPos };
    }


    keyboardInput.addEventListener('input', processPhysicalInput);

    // --- Physical Keyboard Keydown (for specific key handling like Enter/Backspace) ---
    // This is less about conversion, more about visual feedback or preventing default browser actions
    keyboardInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            // The 'input' event will handle the deletion and calling highlightKey('backspace')
            // No need to prevent default unless you want a very custom backspace behavior.
        } else if (e.key === 'Enter') {
            highlightKey('\n'); // Highlight Enter key if you have one on your virtual keyboard, or simply a newline concept
            // Allow default browser Enter (newline insertion)
        }
        // For other keys, 'input' event will capture the character.
    });


    // --- Action Buttons: Copy and Clear ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keyboardInput.value)
                    .then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text using Clipboard API: ', err);
                        // Fallback for older browsers
                        document.execCommand('copy');
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    });
            } else {
                // Fallback for older browsers
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 1500);
            }
            keyboardInput.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
            previousValue = ''; // Reset previous value for next input
            // No highlight for clear, as nothing is inserted
        });
    }

    // --- Optional: Visual Cue for Textarea Focus ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        previousValue = keyboardInput.value; // Initialize previousValue on focus
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    // Initialize previousValue on page load if there's pre-filled text
    previousValue = keyboardInput.value;
});

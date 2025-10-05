document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return;
    }

    // --- Tifinagh Mapping ---
    // This map defines the Latin-to-Tifinagh conversions.
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

    // --- Shifted/Capitalized Tifinagh Mapping ---
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
    };

    // --- Digraph Map (Longest matches first for conversion logic) ---
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted.
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ',
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace'
    };

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghChar) {
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

    // --- Core Conversion Function (Latin to Tifinagh with cursor tracking) ---
    // This function will convert an entire Latin string to Tifinagh
    // and ALSO return the new cursor position after conversion.
    function convertLatinToTifinagh(latinText, originalCursorPos) {
        let tifinaghResult = '';
        let currentLatinIndex = 0;
        let newCursorPos = 0;

        while (currentLatinIndex < latinText.length) {
            let foundMapping = false;
            let charToProcess = latinText[currentLatinIndex]; // Default to single char

            // Try to match digraphs first (longest matches first)
            for (const digraph in digraphMap) {
                if (latinText.substring(currentLatinIndex, currentLatinIndex + digraph.length).toLowerCase() === digraph) {
                    tifinaghResult += digraphMap[digraph];
                    if (currentLatinIndex < originalCursorPos) {
                         // If the cursor was *within* or *at the end of* this digraph in Latin,
                         // it moves to the end of the single Tifinagh character.
                        newCursorPos++;
                    }
                    currentLatinIndex += digraph.length;
                    foundMapping = true;
                    break;
                }
            }

            if (!foundMapping) {
                // If no digraph, try single character mapping
                const char = latinText[currentLatinIndex];
                let mappedChar = tifinaghShiftMap[char]; // Check for case-sensitive first (e.g., 'A' for shifted)
                if (!mappedChar) { // If no case-sensitive match, try regular map
                    mappedChar = tifinaghMap[char.toLowerCase()];
                }

                if (mappedChar) {
                    tifinaghResult += mappedChar;
                    if (currentLatinIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                } else {
                    // If no Tifinagh mapping, keep the original character
                    tifinaghResult += char;
                    if (currentLatinIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                }
                currentLatinIndex++;
            }
        }
        return { text: tifinaghResult, cursorPos: newCursorPos };
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const keyValue = key.dataset.key;
            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            let newValue = keyboardInput.value;
            let newCursorPos = start;

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
                highlightKey('backspace');
            } else {
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
                highlightKey(keyValue);
            }

            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();
            
            // Manually trigger the conversion after virtual key input
            // to ensure consistency with physical keyboard input.
            processInputAndConvert();
        });
    });


    // --- Real-time Conversion on Input (for both physical and mobile native keyboards) ---
    // This is the most robust approach for converting Latin to Tifinagh
    // as it fires after any change to the textarea's value.
    let ignoreNextInput = false; // Flag to prevent re-entrancy during our own updates

    function processInputAndConvert() {
        if (ignoreNextInput) return; // Skip if we are programmatically updating

        const originalLatinInput = keyboardInput.value;
        const originalCursorPos = keyboardInput.selectionStart;

        const { text: convertedTifinaghText, cursorPos: newCursorPos } = convertLatinToTifinagh(originalLatinInput, originalCursorPos);

        if (keyboardInput.value !== convertedTifinaghText) {
            ignoreNextInput = true; // Set flag before updating
            keyboardInput.value = convertedTifinaghText;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            ignoreNextInput = false; // Reset flag after update
        }

        // Attempt to highlight the last Tifinagh character if it was an insertion
        // This is heuristic and might not always be perfect with complex mobile inputs.
        const lastTifinaghChar = convertedTifinaghText[newCursorPos - 1];
        if (lastTifinaghChar) {
            highlightKey(lastTifinaghChar);
        }
    }

    // Listen for any input changes (typing, pasting, mobile native keyboard, etc.)
    keyboardInput.addEventListener('input', processInputAndConvert);

    // --- Physical Keyboard Keydown (for specific key handling like Backspace/Enter) ---
    keyboardInput.addEventListener('keydown', (e) => {
        // We generally let the 'input' event handle character conversions.
        // This 'keydown' is for keys where we might want to prevent default browser behavior
        // or trigger a specific visual feedback.
        if (e.key === 'Backspace') {
            highlightKey('backspace');
            // Allow default browser backspace to happen, then 'input' will re-convert.
            // If you want more custom backspace logic, uncomment e.preventDefault()
            // and implement deletion here.
        } else if (e.key === 'Enter') {
            highlightKey('\n');
            // Allow default browser Enter to happen, then 'input' will re-convert (mapping '\n' to '\n').
        }
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
                        document.execCommand('copy'); // Fallback
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    });
            } else {
                document.execCommand('copy'); // Fallback for older browsers
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
            processInputAndConvert(); // Ensure conversion logic processes the empty string
        });
    }

    // --- Optional: Visual Cue for Textarea Focus ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });
});

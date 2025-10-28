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
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', 'إ': 'ⵉ', 'أُ': 'ⵓ',
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ',
        'ط': 'ⵟ', 'ظ': 'ⵥ',
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', 'ى': 'ⵉ',
        'ء': 'ⴻ',
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',

        ' ': ' ',
        '\n': '\n',
        'ـ': 'ـ',
        'لا': 'ⵍⴰ',
        'لأ': 'ⵍⴰ',
        'لإ': 'ⵍⵉ',
        'لآ': 'ⵍⴰ'
    };

    /**
     * Activates the 'fire-active' animation on a given key element.
     * @param {HTMLElement} keyElement The virtual keyboard button to animate.
     */
    function activateKeyAnimation(keyElement) {
        if (keyElement) {
            // Remove and re-add class to ensure animation restarts
            keyElement.classList.remove('fire-active');
            void keyElement.offsetWidth; // Trigger reflow
            keyElement.classList.add('fire-active');
            setTimeout(() => {
                keyElement.classList.remove('fire-active');
            }, 300); // Matches the animation duration in CSS (0.3s)
        }
    }

    /**
     * Finds a virtual key element based on its data-key (Tifinagh char) or a label.
     * @param {string} searchKey The Tifinagh char, 'backspace', 'enter', or a Latin/Arabic char.
     * @param {string} [type='tifinagh'] 'tifinagh', 'latin', or 'arabic' to search by label.
     * @returns {HTMLElement|null} The matching key element or null.
     */
    function findVirtualKeyElement(searchKey, type = 'tifinagh') {
        // Try finding by data-key first (most specific for Tifinagh chars, space, backspace)
        let keyElement = document.querySelector(`.keyboard-key[data-key="${searchKey}"]`);
        if (keyElement) return keyElement;

        if (type === 'latin') {
            // Find by Latin label (case-insensitive)
            for (const key of keyboardKeys) {
                const latinLabel = key.parentElement.querySelector('.latin-label');
                // Check if label exists and text content matches searchKey (case-insensitive)
                if (latinLabel && latinLabel.textContent.toLowerCase() === searchKey.toLowerCase()) {
                    return key;
                }
            }
        } else if (type === 'arabic') {
            // Find by Arabic label
            for (const key of keyboardKeys) {
                const arabicLabel = key.parentElement.querySelector('.arabic-label');
                // Check if label exists and text content matches searchKey
                if (arabicLabel && arabicLabel.textContent === searchKey) {
                    return key;
                }
            }
        }
        return null;
    }


    function isArabicChar(char) {
        if (!char) return false;
        return char.match(/[\u0600-\u06FF]/);
    }

    function isLatinChar(char) {
        if (!char) return false;
        return char.match(/[a-zA-Z]/);
    }

    // --- Core Conversion Logic for Physical Keyboard Input ---
    function convertSingleCharToTifinagh(inputChar) {
        let tifinaghEquivalent = inputChar; // Default to the input character itself
        
        if (isLatinChar(inputChar)) {
            let mappedChar = tifinaghShiftMap[inputChar]; // Try shifted/capital first
            if (!mappedChar) {
                mappedChar = tifinaghMap[inputChar.toLowerCase()]; // Then try lowercase
            }
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
            }
        } else if (isArabicChar(inputChar)) {
            const mappedChar = arabicToTifinaghMap[inputChar];
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
            }
        } else if (inputChar === ' ') {
            tifinaghEquivalent = ' ';
        } else if (inputChar === '\n') {
            tifinaghEquivalent = '\n';
        }

        return tifinaghEquivalent;
    }

    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default button action

            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            let newValue = keyboardInput.value;
            let newCursorPos = start;

            const keyValue = key.dataset.key; // Tifinagh character or 'backspace'/' '

            if (keyValue === 'backspace') {
                if (start === end) {
                    if (start > 0) {
                        newValue = newValue.substring(0, start - 1) + newValue.substring(end);
                        newCursorPos = start - 1;
                    }
                } else {
                    newValue = newValue.substring(0, start) + newValue.substring(end);
                    newCursorPos = start;
                }
            } else if (keyValue === 'enter') { // Assuming 'enter' key has data-key="enter"
                newValue = newValue.substring(0, start) + '\n' + newValue.substring(end);
                newCursorPos = start + 1;
            } else { // Regular Tifinagh character or space
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
            }

            // Update textarea value
            ignoreNextPhysicalInput = true; // Set flag to prevent conversion by input event
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();

            // Always activate animation for the clicked virtual key
            activateKeyAnimation(key);
            previousValue = keyboardInput.value;
        });
    });

    // --- Real-time Conversion on Physical Keyboard Input ---
    let previousValue = '';
    let ignoreNextPhysicalInput = false;

    // Helper to find inserted characters, robust for pastes and digraphs
    // This helper now uses the actual old and new values to determine insertion
    function findInsertedCharsAndPosition(oldVal, newVal) {
        if (newVal.length <= oldVal.length) {
            return { insertedChars: '', insertionStart: -1 };
        }

        let commonPrefixLength = 0;
        while (commonPrefixLength < oldVal.length && oldVal[commonPrefixLength] === newVal[commonPrefixLength]) {
            commonPrefixLength++;
        }

        let commonSuffixLength = 0;
        const newSuffixStart = newVal.length - (oldVal.length - commonPrefixLength);
        if (newSuffixStart < newVal.length) { // Ensure there's a suffix to check
            while (commonSuffixLength < oldVal.length - commonPrefixLength &&
                   oldVal[oldVal.length - 1 - commonSuffixLength] === newVal[newVal.length - 1 - commonSuffixLength]) {
                commonSuffixLength++;
            }
        }
       
        const insertionStart = commonPrefixLength;
        const insertedChars = newVal.substring(insertionStart, newVal.length - commonSuffixLength);

        return { insertedChars, insertionStart };
    }


    function processPhysicalInput() {
        // If this input event was triggered by our own script updating keyboardInput.value
        // then we should ignore it to prevent infinite loops or incorrect conversions.
        if (ignoreNextPhysicalInput) {
            ignoreNextPhysicalInput = false; // Reset the flag for the next *user* input
            previousValue = keyboardInput.value; // Keep previousValue updated
            return;
        }

        const currentInput = keyboardInput.value;
        const currentCursorPos = keyboardInput.selectionStart;

        // Handle Backspace/Delete key presses. The animation is in keydown.
        if (currentInput.length < previousValue.length) {
            previousValue = currentInput;
            return;
        }

        const { insertedChars, insertionStart } = findInsertedCharsAndPosition(previousValue, currentInput);

        if (!insertedChars || insertedChars.length === 0) {
            previousValue = currentInput; // No new chars, possibly just a cursor move
            return;
        }

        let convertedTextPart = '';
        let charsToProcess = insertedChars;

        // Attempt Digraph conversion first (e.g., 'gh' to 'ⵖ')
        // Only if two chars were inserted
        if (charsToProcess.length === 2) {
            const digraphResult = digraphMap[charsToProcess.toLowerCase()];
            if (digraphResult) {
                convertedTextPart = digraphResult;
                // Animate the result of the digraph (e.g., 'ⵖ')
                let keyToAnimate = findVirtualKeyElement(digraphResult, 'tifinagh');
                if (keyToAnimate) activateKeyAnimation(keyToAnimate);
                charsToProcess = ''; // Mark as processed
            }
        }

        // If not a digraph or if only one char inserted, process character by character
        if (charsToProcess.length > 0) {
            for (let i = 0; i < charsToProcess.length; i++) {
                const char = charsToProcess[i];
                const convertedChar = convertSingleCharToTifinagh(char);
                convertedTextPart += convertedChar;

                // Animate the key corresponding to the *physical* character pressed, if possible
                let keyToAnimate = findVirtualKeyElement(char, isLatinChar(char) ? 'latin' : (isArabicChar(char) ? 'arabic' : 'tifinagh'));
                if (keyToAnimate) activateKeyAnimation(keyToAnimate);
                else { // If no direct Latin/Arabic key match, animate the resulting Tifinagh char
                     keyToAnimate = findVirtualKeyElement(convertedChar, 'tifinagh');
                     if(keyToAnimate) activateKeyAnimation(keyToAnimate);
                }
            }
        }


        // Only update the textarea if something actually converted
        if (convertedTextPart !== insertedChars) {
            const beforeInsertion = currentInput.substring(0, insertionStart);
            const afterInsertion = currentInput.substring(insertionStart + insertedChars.length); // Remove original inserted chars

            const finalNewValue = beforeInsertion + convertedTextPart + afterInsertion;
            const newFinalCursorPos = insertionStart + convertedTextPart.length;

            ignoreNextPhysicalInput = true; // Set flag to ignore the next 'input' event from our update
            keyboardInput.value = finalNewValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newFinalCursorPos;
            // The flag will be reset at the start of the *next* user-triggered input event.
        }

        previousValue = keyboardInput.value; // Update previousValue regardless for consistency
    }

    // --- Input event listener for real-time conversion ---
    keyboardInput.addEventListener('input', processPhysicalInput);

    // --- Keydown event listener for animations only (no conversion logic here) ---
    keyboardInput.addEventListener('keydown', (e) => {
        // Only animate, do NOT prevent default here for character keys
        let keyToAnimate = null;

        if (e.key === 'Enter') {
            keyToAnimate = findVirtualKeyElement('enter');
        } else if (e.key === 'Backspace') {
            keyToAnimate = findVirtualKeyElement('backspace');
        } else if (e.key === ' ') {
            keyToAnimate = findVirtualKeyElement(' ', 'tifinagh'); // Space has data-key=" "
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // For regular character keys, try to find by Latin label
            keyToAnimate = findVirtualKeyElement(e.key, 'latin');
        }

        if (keyToAnimate) {
            activateKeyAnimation(keyToAnimate);
        }
    });

    // --- Copy and Clear button functionality ---
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
                document.execCommand('copy'); // Fallback for older browsers/HTTP
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
            previousValue = ''; // Reset previousValue on clear
        });
    }

    // --- Focus and Blur handling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        previousValue = keyboardInput.value; // Ensure previousValue is updated on focus
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    // Initialize previousValue on page load after all setup
    previousValue = keyboardInput.value;
});

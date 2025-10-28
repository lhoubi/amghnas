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
    function findInsertedCharsAndPosition(oldVal, newVal, oldCursorPos, newCursorPos) {
        const minLength = Math.min(oldVal.length, newVal.length);
        let commonPrefixLength = 0;
        while (commonPrefixLength < minLength && oldVal[commonPrefixLength] === newVal[commonPrefixLength]) {
            commonPrefixLength++;
        }

        let commonSuffixLength = 0;
        while (commonSuffixLength < minLength - commonPrefixLength &&
               oldVal[oldVal.length - 1 - commonSuffixLength] === newVal[newVal.length - 1 - commonSuffixLength]) {
            commonSuffixLength++;
        }

        const insertionStart = commonPrefixLength;
        const insertedChars = newVal.substring(insertionStart, newVal.length - commonSuffixLength);

        return { insertedChars, insertionStart };
    }


    function processPhysicalInput() {
        if (ignoreNextPhysicalInput) {
            ignoreNextPhysicalInput = false;
            previousValue = keyboardInput.value;
            return;
        }

        const currentInput = keyboardInput.value;
        const currentCursorPos = keyboardInput.selectionStart;

        // If characters were deleted (backspace/delete)
        if (currentInput.length < previousValue.length) {
            // Animation for backspace is handled by keydown now, no need to duplicate here
            previousValue = currentInput;
            return;
        }

        const { insertedChars, insertionStart } = findInsertedCharsAndPosition(
            previousValue, currentInput, keyboardInput.selectionStart, keyboardInput.selectionEnd
        );

        if (!insertedChars) { // No actual new char inserted (e.g., cursor move)
            previousValue = currentInput;
            return;
        }

        let convertedInputPart = '';
        let originalCharsProcessed = 0;
        let newCursorOffset = 0; // Tracks how much the cursor position shifts due to conversion

        // Special handling for digraphs (e.g., 'gh', 'ch') before single characters
        // Only check if insertedChars is short and could be a digraph
        if (insertedChars.length <= 2) {
            const lowerInserted = insertedChars.toLowerCase();
            if (digraphMap[lowerInserted]) {
                convertedInputPart = digraphMap[lowerInserted];
                originalCharsProcessed = insertedChars.length;

                // Animate the keys that formed the digraph, or the resulting Tifinagh char
                let keyToAnimate = findVirtualKeyElement(insertedChars, 'latin'); // Try to animate 'g' then 'h'
                if (!keyToAnimate) keyToAnimate = findVirtualKeyElement(convertedInputPart, 'tifinagh');
                if (keyToAnimate) activateKeyAnimation(keyToAnimate);

            }
        }

        if (convertedInputPart === '') { // If not a digraph, process character by character
             for (let i = 0; i < insertedChars.length; i++) {
                const char = insertedChars[i];
                convertedInputPart += convertSingleCharToTifinagh(char);
                originalCharsProcessed++;

                // Animate the key corresponding to the *physical* character pressed
                let keyToAnimate = findVirtualKeyElement(char, isLatinChar(char) ? 'latin' : (isArabicChar(char) ? 'arabic' : 'tifinagh'));
                if (keyToAnimate) activateKeyAnimation(keyToAnimate);
                else { // If direct match not found for Latin/Arabic, try to animate resulting Tifinagh
                     keyToAnimate = findVirtualKeyElement(convertSingleCharToTifinagh(char), 'tifinagh');
                     if(keyToAnimate) activateKeyAnimation(keyToAnimate);
                }
            }
        }


        if (convertedInputPart !== insertedChars) { // Only update if conversion actually occurred
            const beforeInsertion = currentInput.substring(0, insertionStart);
            const afterInsertion = currentInput.substring(insertionStart + originalCharsProcessed);

            const finalNewValue = beforeInsertion + convertedInputPart + afterInsertion;
            const newFinalCursorPos = insertionStart + convertedInputPart.length;

            ignoreNextPhysicalInput = true;
            keyboardInput.value = finalNewValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newFinalCursorPos;
            // No need to set ignoreNextPhysicalInput to false immediately, the 'input' event will fire again.
            // We just need to make sure the *next* 'input' event (triggered by our programmatic change) is ignored.
        }

        previousValue = keyboardInput.value;
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
            // We do NOT preventDefault() here, allowing the browser to insert the char first.
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

    previousValue = keyboardInput.value; // Initialize previousValue on page load
});

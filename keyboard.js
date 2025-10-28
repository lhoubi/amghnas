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

    // --- Mapping to highlight the correct virtual key based on the Tifinagh character inserted ---
    // This map helps find a virtual key based on its Tifinagh character
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', 'ـ': 'ـ',
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace' // Map space and backspace as well
    };

    /**
     * Activates the 'fire-active' animation on a given key element.
     * @param {HTMLElement} keyElement The virtual keyboard button to animate.
     */
    function activateKeyAnimation(keyElement) {
        if (keyElement) {
            keyElement.classList.remove('fire-active'); // Ensure it resets for re-triggering animation
            void keyElement.offsetWidth; // Trigger reflow to restart animation
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
                if (latinLabel && latinLabel.textContent.toLowerCase() === searchKey.toLowerCase()) {
                    return key;
                }
            }
        } else if (type === 'arabic') {
            // Find by Arabic label
            for (const key of keyboardKeys) {
                const arabicLabel = key.parentElement.querySelector('.arabic-label');
                if (arabicLabel && arabicLabel.textContent === searchKey) {
                    return key;
                }
            }
        } else if (type === 'tifinagh') {
             // Fallback to searching by data-key if not found by specific type
             return document.querySelector(`.keyboard-key[data-key="${tifinaghCharToVirtualKeyMap[searchKey]}"]`);
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
        let tifinaghEquivalent = inputChar;
        let charForHighlight = inputChar; // Default to inputChar for highlighting if not converted

        if (isLatinChar(inputChar)) {
            let mappedChar = tifinaghShiftMap[inputChar];
            if (!mappedChar) {
                mappedChar = tifinaghMap[inputChar.toLowerCase()];
            }
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
                charForHighlight = mappedChar; // Highlight the Tifinagh character if converted
            }
        } else if (isArabicChar(inputChar)) {
            const mappedChar = arabicToTifinaghMap[inputChar];
            if (mappedChar !== undefined) {
                tifinaghEquivalent = mappedChar;
                charForHighlight = mappedChar; // Highlight the Tifinagh character if converted
            }
        } else if (inputChar === ' ') {
            tifinaghEquivalent = ' ';
            charForHighlight = ' ';
        } else if (inputChar === '\n') {
            tifinaghEquivalent = '\n';
            charForHighlight = '\n';
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

            const keyValue = key.dataset.key; // Tifinagh character or 'backspace'/' '
            let charToInsert = keyValue;

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
            } else if (keyValue === 'enter') { // Handle 'enter' if you add a virtual enter key
                charToInsert = '\n';
                newValue = newValue.substring(0, start) + charToInsert + newValue.substring(end);
                newCursorPos = start + charToInsert.length;
            } else {
                newValue = newValue.substring(0, start) + charToInsert + newValue.substring(end);
                newCursorPos = start + charToInsert.length;
            }

            ignoreNextPhysicalInput = true; // Set flag before updating value
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

    function findInsertedCharAndPosition(oldVal, newVal) {
        let insertedChar = null;
        let insertionStart = -1;

        if (newVal.length > oldVal.length) {
            let commonPrefixLength = 0;
            while (commonPrefixLength < oldVal.length && commonPrefixLength < newVal.length &&
                   oldPrefix[commonPrefixLength] === newPrefix[commonPrefixLength]) {
                commonPrefixLength++;
            }

            insertionStart = commonPrefixLength;
            insertedChar = newVal.substring(commonPrefixLength, commonPrefixLength + (newVal.length - oldVal.length));

            if (insertedChar.length > 1) { // Potentially a paste or digraph
                 // Check for digraphs if the user typed quickly
                if (insertedChar.length === 2) {
                    const digraph = insertedChar.toLowerCase();
                    if (digraphMap[digraph]) {
                        return { insertedChar: digraph, insertionStart: commonPrefixLength };
                    }
                }
                return { insertedChar: null, insertionStart: -1 }; // Too complex for single char
            }
        }
        return { insertedChar: insertedChar, insertionStart: insertionStart };
    }


    keyboardInput.addEventListener('input', processPhysicalInput); // Ensure this is bound

    function processPhysicalInput() {
        if (ignoreNextPhysicalInput) {
            ignoreNextPhysicalInput = false;
            previousValue = keyboardInput.value;
            return;
        }

        const currentInput = keyboardInput.value;
        const currentCursorPos = keyboardInput.selectionStart;

        // Handle Backspace visually first
        if (currentInput.length < previousValue.length) {
            const backspaceKey = findVirtualKeyElement('backspace');
            if (backspaceKey) activateKeyAnimation(backspaceKey);
            previousValue = currentInput;
            return;
        }

        const { insertedChar, insertionStart } = findInsertedCharAndPosition(previousValue, currentInput);

        if (insertedChar && insertedChar.length > 0) {
            let charToConvert = insertedChar;
            let convertedResult = { convertedChar: charToConvert, charForHighlight: charToConvert };

            // Check for digraphs (e.g., 'gh', 'ch')
            if (insertedChar.length === 2 && digraphMap[insertedChar.toLowerCase()]) {
                convertedResult.convertedChar = digraphMap[insertedChar.toLowerCase()];
                convertedResult.charForHighlight = convertedResult.convertedChar; // Highlight the Tifinagh char
            } else if (insertedChar.length === 1) {
                convertedResult = convertSingleCharToTifinagh(insertedChar);
            }

            // Find the virtual key for the *original* physical input to highlight it
            let keyToHighlight = findVirtualKeyElement(insertedChar, isLatinChar(insertedChar) ? 'latin' : (isArabicChar(insertedChar) ? 'arabic' : 'tifinagh'));

            // If a Tifinagh conversion happened, try to highlight that Tifinagh key
            if (convertedResult.convertedChar !== charToConvert && convertedResult.charForHighlight) {
                keyToHighlight = findVirtualKeyElement(convertedResult.charForHighlight, 'tifinagh') || keyToHighlight;
            }

            if (keyToHighlight) {
                activateKeyAnimation(keyToHighlight);
            }


            if (convertedResult.convertedChar !== charToConvert) { // Only update if a conversion actually happened
                const beforeInsertion = currentInput.substring(0, insertionStart);
                const afterInsertion = currentInput.substring(insertionStart + insertedChar.length);

                ignoreNextPhysicalInput = true;
                keyboardInput.value = beforeInsertion + convertedResult.convertedChar + afterInsertion;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = insertionStart + convertedResult.convertedChar.length;
                ignoreNextPhysicalInput = false;
            }
        } else if (currentInput !== previousValue) {
            // Fallback for complex inputs (like pastes, or cases not caught by insertedChar logic)
            // Re-process the whole input, but this won't trigger key highlights per char
            const { text: convertedText, cursorPos: newPos } = convertMixedInputToTifinagh(currentInput, currentCursorPos);
            if (keyboardInput.value !== convertedText) {
                ignoreNextPhysicalInput = true;
                keyboardInput.value = convertedText;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = newPos;
                ignoreNextPhysicalInput = false;
            }
        }

        previousValue = keyboardInput.value;
    }

    function convertMixedInputToTifinagh(inputText, originalCursorPos) {
        let result = '';
        let newCursorPos = 0;

        for (let i = 0; i < inputText.length; i++) {
            const char = inputText[i];
            const { convertedChar } = convertSingleCharToTifinagh(char);
            result += convertedChar;

            if (i < originalCursorPos) {
                newCursorPos += convertedChar.length;
            }
        }
        return { text: result, cursorPos: newCursorPos };
    }

    // Physical keydown event to catch specific keys like Enter, Backspace for animation
    keyboardInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const enterKey = findVirtualKeyElement('enter'); // Assuming you have an 'enter' data-key
            if (enterKey) activateKeyAnimation(enterKey);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            const backspaceKey = findVirtualKeyElement('backspace');
            if (backspaceKey) activateKeyAnimation(backspaceKey);
        } else if (e.key === ' ') {
            const spaceKey = findVirtualKeyElement(' ', 'tifinagh'); // Space has data-key=" "
            if (spaceKey) activateKeyAnimation(spaceKey);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // For regular character keys, try to find by Latin label
            const charKey = findVirtualKeyElement(e.key, 'latin');
            if (charKey) activateKeyAnimation(charKey);
        }
    });


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
                        // Fallback to execCommand if Clipboard API fails (e.g., old browser, HTTP)
                        document.execCommand('copy');
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    });
            } else {
                // Fallback for browsers that don't support Clipboard API (older browsers, non-HTTPS)
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
            previousValue = ''; // Reset previousValue on clear
        });
    }

    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        previousValue = keyboardInput.value; // Ensure previousValue is updated on focus
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    previousValue = keyboardInput.value; // Initialize previousValue on page load
});

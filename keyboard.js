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
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'ⵇ': 'ⵇ', 'W': 'ⵯ', // Corrected Q to ⵇ
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
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', 'ـ': 'ـ',
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace'
    };

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
        let charForHighlight = inputChar;

        if (isLatinChar(inputChar)) {
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

            const keyValue = key.dataset.key;
            let charForHighlight = keyValue;

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
                charForHighlight = 'backspace';
            } else {
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
            }

            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();

            highlightKey(charForHighlight);
            previousValue = keyboardInput.value; // Update previousValue after virtual key input
        });
    });

    // --- Real-time Conversion on Physical Keyboard Input ---
    let previousValue = '';
    let ignoreNextInput = false;

    // This function now correctly identifies the inserted character regardless of cursor position.
    function findInsertedCharAndPosition(oldVal, newVal, oldCursorPos, newCursorPos) {
        let insertedChar = null;
        let insertionStart = -1;

        if (newVal.length > oldVal.length) { // Something was inserted
            // Find the point where oldVal and newVal start to differ
            let commonPrefixLength = 0;
            while (commonPrefixLength < oldVal.length && commonPrefixLength < newVal.length &&
                   oldVal[commonPrefixLength] === newVal[commonPrefixLength]) {
                commonPrefixLength++;
            }

            // The inserted part starts after the common prefix
            insertionStart = commonPrefixLength;
            insertedChar = newVal.substring(commonPrefixLength, commonPrefixLength + (newVal.length - oldVal.length));
            
            // If more than one character was inserted (e.g., paste), treat as a block.
            // For single character conversion, we only care about the very first character if it's a block.
            if (insertedChar.length > 1) {
                // If it's a paste, we'll process the whole string.
                return { insertedChar: null, insertionStart: -1 }; 
            }
        }
        return { insertedChar: insertedChar, insertionStart: insertionStart };
    }

    function processPhysicalInput() {
        if (ignoreNextInput) return;

        const currentInput = keyboardInput.value;
        const currentCursorPos = keyboardInput.selectionStart;

        // Check for deletion first
        if (currentInput.length < previousValue.length) {
            highlightKey('backspace'); // Assume a backspace/delete action
            previousValue = currentInput;
            return;
        }

        // Check for insertion
        const { insertedChar, insertionStart } = findInsertedCharAndPosition(previousValue, currentInput, keyboardInput.selectionStart, currentCursorPos);

        if (insertedChar && insertedChar.length === 1) {
            const { convertedChar, charForHighlight } = convertSingleCharToTifinagh(insertedChar);

            if (convertedChar !== insertedChar) { // If a conversion actually happened
                ignoreNextInput = true;

                // Reconstruct the value with the converted character
                const beforeInsertion = currentInput.substring(0, insertionStart);
                const afterInsertion = currentInput.substring(insertionStart + insertedChar.length);
                
                keyboardInput.value = beforeInsertion + convertedChar + afterInsertion;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = insertionStart + convertedChar.length;

                ignoreNextInput = false;
                highlightKey(charForHighlight);
            } else {
                // No conversion, but still a single character typed
                highlightKey(insertedChar);
            }
        } else if (currentInput !== previousValue) {
            // This path handles pastes or multiple character insertions that `findInsertedCharAndPosition` might not catch as a single char.
            // We re-process the whole string for conversion, but try to maintain cursor position.
            const { text: convertedText, cursorPos: newPos } = convertMixedInputToTifinagh(currentInput, currentCursorPos);
            if (keyboardInput.value !== convertedText) {
                ignoreNextInput = true;
                keyboardInput.value = convertedText;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = newPos;
                ignoreNextInput = false;
            }
        }

        previousValue = keyboardInput.value;
    }

    function convertMixedInputToTifinagh(inputText, originalCursorPos) {
        let result = '';
        let newCursorPos = 0;
        let originalLengthBeforeCursor = 0;

        // Determine the length of the string before the cursor in original text
        if (originalCursorPos > 0) {
            originalLengthBeforeCursor = inputText.substring(0, originalCursorPos).length;
        }

        for (let i = 0; i < inputText.length; i++) {
            const char = inputText[i];
            const { convertedChar } = convertSingleCharToTifinagh(char);
            result += convertedChar;
            
            // Adjust newCursorPos if we are still before or at the original cursor position
            if (i < originalCursorPos) {
                newCursorPos += convertedChar.length;
            }
        }
        return { text: result, cursorPos: newCursorPos };
    }

    keyboardInput.addEventListener('input', processPhysicalInput);

    keyboardInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            highlightKey('\n');
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
                        document.execCommand('copy');
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    });
            } else {
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
            previousValue = '';
        });
    }

    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        previousValue = keyboardInput.value;
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    previousValue = keyboardInput.value;
});

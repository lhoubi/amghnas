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
            // We set ignoreNextPhysicalInput to true because this change is programmatic.
            // This prevents the 'input' event from re-processing the virtual keyboard input.
            ignoreNextPhysicalInput = true; 
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();

            // Always activate animation for the clicked virtual key
            activateKeyAnimation(key);
            previousValue = keyboardInput.value; // Keep previousValue updated
        });
    });

    // --- Real-time Conversion on Physical Keyboard Input ---
    let previousValue = '';
    let ignoreNextPhysicalInput = false;
    let pendingDigraphChar = ''; // Stores the first char of a potential digraph (e.g., 'g' when 'gh' is typed)


    // Helper to insert text at the current cursor position
    function insertAtCursor(textarea, textToInsert) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }

    // Helper to delete characters at the current cursor position
    function deleteAtCursor(textarea, length) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        if (start === end) {
            if (start >= length) {
                textarea.value = value.substring(0, start - length) + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start - length;
            }
        } else {
            textarea.value = value.substring(0, start) + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start;
        }
    }


    // --- Keydown event listener for animations and conversion logic ---
    keyboardInput.addEventListener('keydown', (e) => {
        // Animate virtual key on keydown for visual feedback
        let keyToAnimate = null;

        if (e.key === 'Enter') {
            keyToAnimate = findVirtualKeyElement('enter');
        } else if (e.key === 'Backspace') {
            keyToAnimate = findVirtualKeyElement('backspace');
        } else if (e.key === ' ') {
            keyToAnimate = findVirtualKeyElement(' ', 'tifinagh');
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            keyToAnimate = findVirtualKeyElement(e.key, 'latin');
        }

        if (keyToAnimate) {
            activateKeyAnimation(keyToAnimate);
        }

        // --- Core conversion logic for physical character keys ---
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const inputChar = e.key;
            let convertedChar = '';
            let charHandled = false; // Flag to indicate if the character was converted/digraph handled

            // 1. Try Digraph conversion if a pending char exists
            if (pendingDigraphChar) {
                const potentialDigraph = (pendingDigraphChar + inputChar).toLowerCase();
                const digraphResult = digraphMap[potentialDigraph];
                if (digraphResult) {
                    e.preventDefault(); // Prevent the current character from being inserted
                    deleteAtCursor(keyboardInput, 1); // Delete the previously inserted pendingDigraphChar
                    insertAtCursor(keyboardInput, digraphResult);
                    convertedChar = digraphResult;
                    charHandled = true;
                    pendingDigraphChar = ''; // Reset after successful digraph
                    // Animate the resulting Tifinagh digraph character
                    let digraphKey = findVirtualKeyElement(digraphResult, 'tifinagh');
                    if (digraphKey) activateKeyAnimation(digraphKey);
                } else {
                    // If the current char doesn't form a digraph with the pending one,
                    // the pending char will just be a regular character (already inserted by browser).
                    // We need to clear pendingDigraphChar so it doesn't interfere with next input.
                    pendingDigraphChar = '';
                }
            }

            // 2. If not handled as a digraph, process as a single character
            if (!charHandled) {
                // Check if the current character could *start* a digraph
                let couldStartDigraph = false;
                for (const digraphPrefix in digraphMap) {
                    if (digraphPrefix.startsWith(inputChar.toLowerCase()) && digraphPrefix.length > 1) {
                        couldStartDigraph = true;
                        break;
                    }
                }

                if (couldStartDigraph) {
                    pendingDigraphChar = inputChar;
                    // We let the browser insert this character. If the next character forms a digraph,
                    // we'll delete this one and replace it. If not, it stays as is.
                } else {
                    convertedChar = convertSingleCharToTifinagh(inputChar);
                    if (convertedChar !== inputChar) { // Only prevent default if a conversion will happen
                        e.preventDefault();
                        insertAtCursor(keyboardInput, convertedChar);
                        // Animate the resulting Tifinagh character
                        let tifinaghKey = findVirtualKeyElement(convertedChar, 'tifinagh');
                        if (tifinaghKey) activateKeyAnimation(tifinaghKey);
                    }
                    pendingDigraphChar = ''; // Clear any pending digraph char
                }
            }
        } else {
            // Clear pending char if non-character key (e.g., Space, Enter, Ctrl) is pressed
            // This prevents "gh" becoming "ⵖ" if you type "g<space>h"
            pendingDigraphChar = '';
        }
    });

    // --- Input event listener (kept but modified to be mostly passive for conversions) ---
    // The `input` event is still useful for handling pastes, drag-and-drops,
    // or other ways text might enter the textarea that don't involve a keydown.
    // However, it should NOT try to re-convert characters that `keydown` has already handled.
    keyboardInput.addEventListener('input', () => {
        if (ignoreNextPhysicalInput) {
            ignoreNextPhysicalInput = false; // Reset the flag
            // Ensure previousValue is updated even if we ignored an input caused by programmatic change
            previousValue = keyboardInput.value;
            return;
        }

        // This part would primarily handle cases like pasting, where 'insertedChars'
        // can be longer than 1 or contain non-Latin/Arabic characters already.
        // For direct typing, `keydown` now preempts this for Latin/Arabic.
        // We ensure `previousValue` is always up-to-date.
        previousValue = keyboardInput.value;
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
            pendingDigraphChar = ''; // Reset pending digraph on clear
        });
    }

    // --- Focus and Blur handling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        previousValue = keyboardInput.value; // Ensure previousValue is updated on focus
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
        pendingDigraphChar = ''; // Clear pending digraph on blur
    });

    // Initialize previousValue on page load after all setup
    previousValue = keyboardInput.value;
});

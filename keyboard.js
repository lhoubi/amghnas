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
    // Ensure all common Latin letters have a base Tifinagh mapping
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ', // Space key
        '\n': '\n' // Enter key (newline) - not really part of map for individual chars, but good to have
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for Latin input) ---
    // These are for specific capital letters or shifted keys that produce a distinct Tifinagh char
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
        // Add more if needed, e.g., for digits or symbols that map to Tifinagh
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    // Order matters for matching
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
        // Ensure no single char in tifinaghMap conflicts with start of digraph if a common key.
        // E.g., if 's' maps to 'ⵙ' and 'sh' maps to 'ⵛ', 's' should be handled for 's' and 'sh' for 'sh'.
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
        'ـ': 'ـ', // Arabic Tatweel
        'لا': 'ⵍⴰ', // Ligatures (should be handled carefully, might need specific logic)
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
        let keyElement = document.querySelector(`.keyboard-key[data-key="${searchKey}"]`);
        if (keyElement) return keyElement;

        if (type === 'latin') {
            for (const key of keyboardKeys) {
                const latinLabel = key.parentElement.querySelector('.latin-label');
                if (latinLabel && latinLabel.textContent.toLowerCase() === searchKey.toLowerCase()) {
                    return key;
                }
            }
        } else if (type === 'arabic') {
            for (const key of keyboardKeys) {
                const arabicLabel = key.parentElement.querySelector('.arabic-label');
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
    // This function will now be called directly with the input character
    // and is expected to return the Tifinagh equivalent or null/undefined if no direct conversion.
    function convertCharToTifinagh(inputChar) {
        // Try shifted/capital Latin first
        if (tifinaghShiftMap[inputChar] !== undefined) {
            return tifinaghShiftMap[inputChar];
        }
        // Then try lowercase Latin
        if (tifinaghMap[inputChar.toLowerCase()] !== undefined) {
            return tifinaghMap[inputChar.toLowerCase()];
        }
        // Then try Arabic
        if (arabicToTifinaghMap[inputChar] !== undefined) {
            return arabicToTifinaghMap[inputChar];
        }
        // If no direct conversion found, return null
        return null;
    }

    // Helper to insert text at the current cursor position
    function insertAtCursor(textarea, textToInsert) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }

    // Helper to delete characters at the current cursor position (backwards)
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
            // If there's a selection, delete the selection
            textarea.value = value.substring(0, start) + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start;
        }
    }

    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const keyValue = key.dataset.key;

            if (keyValue === 'backspace') {
                deleteAtCursor(keyboardInput, 1); // Delete one character backwards
            } else if (keyValue === 'enter') {
                insertAtCursor(keyboardInput, '\n');
            } else {
                insertAtCursor(keyboardInput, keyValue);
            }
            
            keyboardInput.focus();
            activateKeyAnimation(key);
        });
    });

    let pendingDigraphChar = ''; // Stores the first char of a potential digraph

    // --- Keydown event listener for animations and conversion logic ---
    keyboardInput.addEventListener('keydown', (e) => {
        // --- Animate virtual key (this part remains largely the same) ---
        let keyToAnimate = null;
        if (e.key === 'Enter') {
            keyToAnimate = findVirtualKeyElement('enter');
        } else if (e.key === 'Backspace') {
            keyToAnimate = findVirtualKeyElement('backspace');
        } else if (e.key === ' ') {
            keyToAnimate = findVirtualKeyElement(' ', 'tifinagh');
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            keyToAnimate = findVirtualKeyElement(e.key, 'latin'); // Try to animate Latin key
            if (!keyToAnimate) {
                // If no specific Latin key, try to animate the resulting Tifinagh char for immediate feedback
                const potentialTifinagh = convertCharToTifinagh(e.key);
                if (potentialTifinagh) {
                    keyToAnimate = findVirtualKeyElement(potentialTifinagh, 'tifinagh');
                }
            }
        }
        if (keyToAnimate) {
            activateKeyAnimation(keyToAnimate);
        }

        // --- Core conversion logic for physical character keys ---
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const inputChar = e.key;
            let charHandled = false; // Flag to indicate if the character was converted/digraph handled

            // 1. Digraph Handling: Check if the current char completes a pending digraph
            if (pendingDigraphChar) {
                const potentialDigraph = (pendingDigraphChar + inputChar).toLowerCase();
                const digraphResult = digraphMap[potentialDigraph];
                if (digraphResult) {
                    e.preventDefault(); // Prevent current char from being inserted
                    deleteAtCursor(keyboardInput, 1); // Delete the temporarily inserted pendingDigraphChar
                    insertAtCursor(keyboardInput, digraphResult); // Insert the Tifinagh digraph
                    charHandled = true;
                    pendingDigraphChar = ''; // Reset after successful digraph
                    // Animate the resulting Tifinagh digraph character
                    let digraphKey = findVirtualKeyElement(digraphResult, 'tifinagh');
                    if (digraphKey) activateKeyAnimation(digraphKey);
                } else {
                    // If current char doesn't form a digraph, the pendingChar stays as a single char (already inserted).
                    // We just clear pendingDigraphChar so it doesn't try to form digraphs with subsequent chars.
                    pendingDigraphChar = '';
                }
            }

            // 2. Single Character Conversion: If not handled by digraph, try single char conversion
            if (!charHandled) {
                const convertedChar = convertCharToTifinagh(inputChar);

                if (convertedChar) { // If a Tifinagh equivalent was found
                    // Check if this character could START a digraph.
                    // If it can, we store it and allow the browser to insert it temporarily.
                    // We will replace it if the next key completes a digraph.
                    let couldStartDigraph = false;
                    for (const digraphPrefix in digraphMap) {
                        if (digraphPrefix.startsWith(inputChar.toLowerCase()) && digraphPrefix.length > 1) {
                            couldStartDigraph = true;
                            break;
                        }
                    }

                    if (couldStartDigraph) {
                        pendingDigraphChar = inputChar;
                        // Allow browser to insert the character temporarily. No e.preventDefault() here.
                        // The 'input' event will fire, and if we let it go, the 'g' will appear.
                        // We rely on the digraph logic to delete and replace it if 'h' comes next.
                    } else {
                        e.preventDefault(); // Prevent the browser from inserting the original char
                        insertAtCursor(keyboardInput, convertedChar); // Insert the Tifinagh char
                        // Animate the resulting Tifinagh character (already done at the beginning of keydown)
                        pendingDigraphChar = ''; // Clear any pending digraph char
                    }
                } else {
                    // No Tifinagh conversion found. Allow browser default (e.g., numbers, symbols, unrecognized Latin/Arabic)
                    pendingDigraphChar = ''; // Clear pendingDigraphChar if no conversion occurred
                }
            }
        } else {
            // For non-character keys (e.g., Space, Enter, Tab, Ctrl, Alt), clear pending digraph state
            pendingDigraphChar = '';
        }
    });

    // The 'input' event listener is now truly passive for physical keyboard character inputs,
    // only updating previousValue for cases like paste or other programmatic changes.
    keyboardInput.addEventListener('input', () => {
        // If this input was triggered by our own script (e.g., virtual keyboard click), ignore for conversion.
        // This flag is set by virtual keyboard actions to prevent double processing.
        // It's also critical to ensure `previousValue` is always correctly synced with the actual content.
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

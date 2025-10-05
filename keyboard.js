document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    // --- Tifinagh Mapping for physical keyboard input ---
    // Customize this map to your preferred phonetic or standard Tifinagh transliteration.
    // Keys are lowercase to handle input regardless of Shift key.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ', // Changed 'r' to 'ⵔ'
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ', // Added 'w' mapping
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        // Common digraphs or special characters (some will be handled by look-ahead, others by direct map)
        'gh': 'ⵖ', // for 'gh' combination
        'kh': 'ⵅ', // for 'kh' combination
        'ch': 'ⵛ', // for 'ch' combination
        'sh': 'ⵛ', // another mapping for 'ch'
        'dh': 'ⴷ', // another mapping for 'd'
        'th': 'ⵜ', // another mapping for 't'
        'ts': 'ⵚ', // another mapping for 's'
        'dz': 'ⴷⵣ', // example for two Tifinagh chars from two Latin
        'tl': 'ⵟⵍ', // example
        'j_soft': 'ⵊ', // You might need special mapping for soft 'j' if 'j' is hard
        // Punctuation and special symbols you might want to map
        ',': ',', '.': '.', '/': '/', '\'': '\'', '-': '-',
        'ç': 'ⵛ', // French 'ç' often maps to 'ch' sound
        'ṭ': 'ⴹ', // Example for 't' with a dot
        'ḍ': 'ⴹ', // Example for 'd' with a dot
        'ḥ': 'ⵃ', // Example for 'h' with a dot
        'ṣ': 'ⵚ', // Example for 's' with a dot
        'ẓ': 'ⵥ', // Example for 'z' with a dot
        'ɛ': 'ⵄ', // Example for 'ain'
        'ɣ': 'ⵖ', // Example for 'ghain'
        'ʷ': 'ⵯ', // Labialized sound - This might conflict with 'w' if not careful. Removed 'ⵯ' from 'w' as it's a separate char now.
        // Mapping for specific keyboard keys that don't directly produce chars but have meaning
        ' ': ' ', // Space key
        'enter': '\n' // Enter key
    };

    // New map for shifted/capitalized keys
    const tifinaghShiftMap = {
        'A': 'ⵄ', // Added A majuscule mapping
        'G': 'ⵖ',
        'H': 'ⵃ',
        'D': 'ⴹ',
        'T': 'ⵟ',
        'R': 'ⵕ',
        'S': 'ⵚ',
        'Z': 'ⵥ'
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted
    // This maps the Tifinagh character to the 'data-key' attribute value of the virtual button.
    const tifinaghKeyToVirtualDataKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵕ': 'ⵕ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', // Added 'ⵡ'
        'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ', 'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ',
        'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ', 'ⵄ': 'ⵄ', 'ⵔ': 'ⵔ', // Added 'ⵔ'
        ' ': ' ', // The spacebar's data-key is also ' '
        'backspace': 'backspace' // The backspace button's data-key
        // Add more if your virtual keyboard has unique data-key values that differ from the character
    };


    // Function to insert text at the cursor position
    function insertAtCursor(field, text) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const value = field.value;
        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;
        // No explicit focus() here, as for physical input, focus is already there.
        // For virtual clicks, we will call it after insertion.
    }

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghDataKey) {
        const matchingKey = document.querySelector(`.keyboard-key[data-key="${tifinaghDataKey}"]`);
        if (matchingKey) {
            matchingKey.classList.add('active');
            setTimeout(() => {
                matchingKey.classList.remove('active');
            }, 150); // Highlight for a short duration
        }
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key; // Get the character from data-key attribute

            if (keyValue === 'backspace') {
                const start = keyboardInput.selectionStart;
                const end = keyboardInput.selectionEnd;
                if (start === end) { // No selection, just delete one char
                    if (start > 0) {
                        keyboardInput.value = keyboardInput.value.substring(0, start - 1) + keyboardInput.value.substring(end);
                        keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
                    }
                } else { // Delete selected text
                    keyboardInput.value = keyboardInput.value.substring(0, start) + keyboardInput.value.substring(end);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
                }
                highlightKey('backspace');
            } else {
                insertAtCursor(keyboardInput, keyValue);
                highlightKey(keyValue); // Highlight the virtual key clicked
            }
            keyboardInput.focus(); // Keep focus on the textarea after any virtual input
        });
    });

    // --- Physical Keyboard Input Handling ---
    keyboardInput.addEventListener('keydown', (e) => {
        const currentCursorPos = keyboardInput.selectionStart;
        const precedingChar = keyboardInput.value.substring(currentCursorPos - 1, currentCursorPos).toLowerCase();
        const key = e.key; // Get the pressed key as is (to differentiate 'g' from 'G')

        // 1. Handle Backspace key
        if (key === 'Backspace') { // Use 'Backspace' not 'backspace' for actual key event
            e.preventDefault(); // Prevent default browser backspace
            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            if (start === end) {
                if (start > 0) {
                    keyboardInput.value = keyboardInput.value.substring(0, start - 1) + keyboardInput.value.substring(end);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
                }
            } else {
                keyboardInput.value = keyboardInput.value.substring(0, start) + keyboardInput.value.substring(end);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
            highlightKey('backspace'); // Highlight the virtual backspace key
            return;
        }

        // 2. Ignore Modifier Keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab') {
            return; // Don't prevent default for these, but don't try to map
        }

        // Prevent default character input for mapped keys and potential digraphs
        e.preventDefault();

        // 3. Handle Enter/Return Key
        if (key === 'Enter') { // Use 'Enter' not 'enter' for actual key event
            insertAtCursor(keyboardInput, '\n');
            return;
        }

        let insertedTifinaghChar = null;

        // --- Handle Shifted/Capitalized Mappings FIRST ---
        // Check if Shift is held OR CapsLock is on AND the key is in our tifinaghShiftMap
        const isShiftedOrCaps = e.shiftKey || e.getModifierState('CapsLock');
        if (isShiftedOrCaps && tifinaghShiftMap[key]) {
            insertAtCursor(keyboardInput, tifinaghShiftMap[key]);
            insertedTifinaghChar = tifinaghShiftMap[key];
        } else {
            // 4. Handle Digraphs (two-key combinations) - e.g., 'ch' -> 'ⵛ', 'gh' -> 'ⵖ'
            const lowerKey = key.toLowerCase(); // Use lowercase for digraph checks
            if (precedingChar && lowerKey === 'h') {
                if (precedingChar === 'c' || precedingChar === 's') {
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵛ' + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = 'ⵛ';
                } else if (precedingChar === 'g') {
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵖ' + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = 'ⵖ';
                } else if (precedingChar === 'k') {
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵅ' + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = 'ⵅ';
                }
                // Add more 'h' digraphs here (e.g., 'th', 'dh')
            }
            // Example: 'ts' -> 'ⵚ'
            if (precedingChar && lowerKey === 's' && precedingChar === 't') {
                keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵚ' + keyboardInput.value.substring(currentCursorPos);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                insertedTifinaghChar = 'ⵚ';
            }


            // 5. Handle Single Character Mapping (if no digraph or shifted mapping was handled)
            if (insertedTifinaghChar === null) {
                const mappedChar = tifinaghMap[lowerKey]; // Use lowerKey for standard map lookup
                if (mappedChar) {
                    insertAtCursor(keyboardInput, mappedChar);
                    insertedTifinaghChar = mappedChar;
                } else {
                    // If no Tifinagh mapping, insert the original key (for numbers, unmapped punctuation, etc.)
                    insertAtCursor(keyboardInput, key); // Use original 'key' to preserve case for non-mapped chars
                }
            }
        }

        // 6. Highlight the corresponding virtual key (if a Tifinagh char was inserted)
        if (insertedTifinaghChar) {
            highlightKey(insertedTifinaghChar);
        }
    });

    // --- Action Buttons: Copy and Clear ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select();
            document.execCommand('copy');
            // Optional: Provide user feedback
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 1500);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
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
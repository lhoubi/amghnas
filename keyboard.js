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
    // This map is primarily for physical keyboard input.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ',
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        // Common digraphs or special characters (some will be handled by look-ahead, others by direct map)
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', // These specific digraphs need careful handling in keydown.
        'dh': 'ⴷ', // Assuming 'd' + 'h' maps to 'ⴷ' (or a specific Tifinagh 'Dh')
        'th': 'ⵜ', // Assuming 't' + 'h' maps to 'ⵜ' (or a specific Tifinagh 'Th')
        'ts': 'ⵚ',
        // 'dz': 'ⴷⵣ', 'tl': 'ⵟⵍ', // Complex digraphs may need more advanced logic
        ' ': ' ', // Space key
        'enter': '\n' // Enter key
    };

    const tifinaghShiftMap = {
        'A': 'ⵄ', // Added A majuscule mapping
        'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'K': 'ⴽ', 'ⵏ': 'ⵑ', // Example for 'N' shifted to 'ⵑ'
        'L': 'ⵍ',
        // Add more shifted/capitalized mappings as needed
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted
    // Ensure this map covers ALL Tifinagh characters you expect to be inserted.
    const tifinaghKeyToVirtualDataKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', 'ⵑ': 'ⵑ', // Added for comprehensive highlighting
        ' ': ' ',
        'backspace': 'backspace',
        '\n': 'enter'
    };


    // Function to insert text at the cursor position (and trigger input event)
    function insertAtCursor(field, text) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const value = field.value;

        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;

        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);

        field.focus(); // Keep focus on the textarea after virtual input (no blur now)
    }

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghDataKey) {
        const virtualKey = tifinaghKeyToVirtualDataKeyMap[tifinaghDataKey] || tifinaghDataKey;
        const matchingKey = document.querySelector(`.keyboard-key[data-key="${virtualKey}"]`);
        if (matchingKey) {
            matchingKey.classList.add('active');
            setTimeout(() => {
                matchingKey.classList.remove('active');
            }, 150);
        }
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default button behavior (e.g., form submission)

            const keyValue = key.dataset.key; // Get the character from data-key attribute

            if (keyValue === 'backspace') {
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
                highlightKey('backspace');
                const inputEvent = new Event('input', { bubbles: true });
                keyboardInput.dispatchEvent(inputEvent);

            } else {
                insertAtCursor(keyboardInput, keyValue);
                highlightKey(keyValue);
            }
            keyboardInput.focus(); // Keep focus on the textarea (no blur now)
        });
    });

    // --- Physical Keyboard Input Handling ---
    // This listener is now crucial for both desktop and mobile (if a Tifinagh native keyboard is enabled).
    keyboardInput.addEventListener('keydown', (e) => {
        const currentCursorPos = keyboardInput.selectionStart;
        const precedingChar = keyboardInput.value.substring(currentCursorPos - 1, currentCursorPos).toLowerCase();
        const key = e.key;

        // 1. Handle Backspace key
        if (key === 'Backspace') {
            e.preventDefault(); // Prevent default browser backspace (we handle it manually)
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
            highlightKey('backspace');
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
            return;
        }

        // 2. Ignore Modifier Keys and keys we don't want to map or prevent default for
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab' || key.length > 1) { // key.length > 1 catches most non-character keys
            return;
        }

        // Important: For actual character input, we only want to preventDefault IF we successfully
        // map the key to a Tifinagh character or a digraph.
        // If we don't preventDefault for an unmapped key, the browser will insert it.
        // If a native Tifinagh keyboard is enabled, it should ideally insert Tifinagh chars directly,
        // and our keydown listener should then *not* preventDefault for those (or handle them carefully).
        // This is where the challenge lies with native mobile keyboards.

        let insertedTifinaghChar = null;
        const lowerKey = key.toLowerCase();

        // 3. Handle Enter/Return Key
        if (key === 'Enter') {
            insertAtCursor(keyboardInput, '\n');
            e.preventDefault(); // Prevent default new line behavior if not already handled by insertAtCursor
            return;
        }

        // --- Handle Shifted/Capitalized Mappings FIRST ---
        const isShiftedOrCaps = e.shiftKey || e.getModifierState('CapsLock');
        if (isShiftedOrCaps && tifinaghShiftMap[key]) {
            e.preventDefault(); // Prevent default Latin char if we are mapping
            insertAtCursor(keyboardInput, tifinaghShiftMap[key]);
            insertedTifinaghChar = tifinaghShiftMap[key];
        } else {
            // --- Handle Digraphs (two-key combinations) ---
            if (precedingChar && !e.shiftKey) {
                let replaced = false;
                let newChar = '';
                if (lowerKey === 'h') {
                    if (precedingChar === 'c' || precedingChar === 's') { newChar = 'ⵛ'; replaced = true; }
                    else if (precedingChar === 'g') { newChar = 'ⵖ'; replaced = true; }
                    else if (precedingChar === 'k') { newChar = 'ⵅ'; replaced = true; }
                    // Add more 'h' digraphs here (e.g., 'dh', 'th') if they don't map to single keys.
                    // For example, if 'd' maps to 'ⴷ' and 'dh' should also map to 'ⴷ', this logic needs refinement.
                } else if (lowerKey === 's' && precedingChar === 't') { newChar = 'ⵚ'; replaced = true; }

                if (replaced && newChar) {
                    e.preventDefault(); // Prevent default for the 'h' or 's' key
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + newChar + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = newChar;
                    const inputEvent = new Event('input', { bubbles: true });
                    keyboardInput.dispatchEvent(inputEvent);
                }
            }

            // 5. Handle Single Character Mapping (if no digraph or shifted mapping was handled yet)
            if (insertedTifinaghChar === null) {
                const mappedChar = tifinaghMap[lowerKey];
                if (mappedChar) {
                    e.preventDefault(); // Prevent default Latin char if we are mapping
                    insertAtCursor(keyboardInput, mappedChar);
                    insertedTifinaghChar = mappedChar;
                } else {
                    // If no Tifinagh mapping for this key, and it's a single character key,
                    // DO NOT preventDefault(). Let the browser handle it.
                    // This is for unmapped Latin characters, numbers, etc.
                    // If a native Tifinagh keyboard is active, it should insert Tifinagh here.
                    // Your `input` event listener (if you have one elsewhere, e.g. for `converter.js`)
                    // will process the actual character that lands in the textarea.
                    insertedTifinaghChar = key; // Use the actual key if no mapping, for highlighting
                }
            }
        }

        // 6. Highlight the corresponding virtual key (if a Tifinagh char was inserted or typed)
        if (insertedTifinaghChar) {
            highlightKey(insertedTifinaghChar);
        }
    });

    // --- Action Buttons: Copy and Clear ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 1500);
            keyboardInput.focus(); // Keep focus after copying
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus(); // Keep focus after clearing
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
        });
    }

    // --- Optional: Visual Cue for Textarea Focus ---
    // These listeners ensure the visual 'focused' state is maintained
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });
});

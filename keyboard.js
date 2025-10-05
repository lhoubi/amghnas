document.addEventListener('DOMContentLoaded', () => {
    // Correctly reference your main input textarea.
    // Assuming 'keyboardInput' is the ID of your primary textarea for Tifinagh input.
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return; // Stop execution if the main input isn't found
    }

    // --- Tifinagh Mapping ---
    // This map is primarily for physical keyboard input, but the virtual keyboard will also use similar logic.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', // *** NEW: 'o' maps to 'ⵓ' ***
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        // Common digraphs or special characters (some will be handled by look-ahead, others by direct map)
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴷ',
        'th': 'ⵜ', 'ts': 'ⵚ', 'dz': 'ⴷⵣ', 'tl': 'ⵟⵍ',
        'j_soft': 'ⵊ', // You might need special mapping for soft 'j' if 'j' is hard
        // Punctuation and special symbols you might want to map
        ',': ',', '.': '.', '/': '/', '\'': '\'', '-': '-',
        'ç': 'ⵛ', 'ṭ': 'ⴹ', 'ḍ': 'ⴹ', 'ḥ': 'ⵃ', 'ṣ': 'ⵚ', 'ẓ': 'ⵥ',
        'ɛ': 'ⵄ', 'ɣ': 'ⵖ',
        ' ': ' ', // Space key
        'enter': '\n' // Enter key
    };

    // New map for shifted/capitalized keys
    const tifinaghShiftMap = {
        'A': 'ⵄ', // Added A majuscule mapping
        'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'K': 'ⴽ', 'L': 'ⵍ' // Added more shifted common Tifinagh characters for better coverage
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted
    const tifinaghKeyToVirtualDataKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵕ': 'ⵕ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ',
        'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ', 'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ',
        'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ', 'ⵄ': 'ⵄ', 'ⵔ': 'ⵔ',
        ' ': ' ',
        'backspace': 'backspace'
        // Ensure all Tifinagh characters you expect to be inserted have a mapping here
    };


    // Function to insert text at the cursor position (and trigger input event)
    function insertAtCursor(field, text) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const value = field.value;

        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;

        // *** NEW: Trigger 'input' event manually ***
        // This will make your converter.js (and other listeners) react immediately.
        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);

        field.focus(); // Keep focus on the textarea after virtual input
    }

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghDataKey) {
        // Use the tifinaghKeyToVirtualDataKeyMap to find the correct data-key if needed,
        // otherwise assume tifinaghDataKey is already a valid data-key.
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
        key.addEventListener('click', (event) => { // *** NEW: Add event parameter ***
            event.preventDefault(); // *** NEW: Prevent default behavior for virtual keyboard keys ***
                                    // This is CRUCIAL for mobile to prevent unwanted actions like native keyboard pop-up or scrolling.

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
                // *** NEW: Trigger input event for backspace too ***
                const inputEvent = new Event('input', { bubbles: true });
                keyboardInput.dispatchEvent(inputEvent);

            } else {
                // *** NEW: Directly insert the Tifinagh character from data-tifinagh-char if available ***
                // This makes the virtual keyboard's 'o' button directly insert 'ⵓ' if you set data-tifinagh-char="ⵓ" on it.
                const tifinaghCharToInsert = key.dataset.tifinaghChar || keyValue;
                insertAtCursor(keyboardInput, tifinaghCharToInsert);
                highlightKey(tifinaghCharToInsert);
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
        if (key === 'Backspace') {
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
            // *** NEW: Trigger input event for physical backspace too ***
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
            return;
        }

        // 2. Ignore Modifier Keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab') {
            return;
        }

        // Prevent default character input for mapped keys and potential digraphs
        // We generally want to prevent default for any key we are mapping to Tifinagh
        // to avoid Latin character showing up first then being replaced.
        e.preventDefault();

        // 3. Handle Enter/Return Key
        if (key === 'Enter') {
            insertAtCursor(keyboardInput, '\n'); // insertAtCursor already triggers 'input'
            return;
        }

        let insertedTifinaghChar = null;
        const lowerKey = key.toLowerCase(); // Use lowercase for map lookups

        // --- Handle Shifted/Capitalized Mappings FIRST ---
        const isShiftedOrCaps = e.shiftKey || e.getModifierState('CapsLock');
        if (isShiftedOrCaps && tifinaghShiftMap[key]) { // Use raw 'key' for shifted map
            insertAtCursor(keyboardInput, tifinaghShiftMap[key]);
            insertedTifinaghChar = tifinaghShiftMap[key];
        } else {
            // --- Handle Digraphs (two-key combinations) ---
            // Only check for digraphs if a single char hasn't been handled by shiftMap
            if (precedingChar && !e.shiftKey) { // Avoid digraphs if Shift is held down for clarity
                let replaced = false;
                if (lowerKey === 'h') {
                    if (precedingChar === 'c' || precedingChar === 's') { // ch, sh
                        keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵛ' + keyboardInput.value.substring(currentCursorPos);
                        keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                        insertedTifinaghChar = 'ⵛ'; replaced = true;
                    } else if (precedingChar === 'g') { // gh
                        keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵖ' + keyboardInput.value.substring(currentCursorPos);
                        keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                        insertedTifinaghChar = 'ⵖ'; replaced = true;
                    } else if (precedingChar === 'k') { // kh
                        keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵅ' + keyboardInput.value.substring(currentCursorPos);
                        keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                        insertedTifinaghChar = 'ⵅ'; replaced = true;
                    }
                    // Add more 'h' digraphs here (e.g., 'th', 'dh')
                    // For 'dh', if 'd' is already mapped, you need to decide if 'dh' replaces 'd' + 'h'
                    // For now, let's keep it simple.
                } else if (lowerKey === 's' && precedingChar === 't') { // ts
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵚ' + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = 'ⵚ'; replaced = true;
                }
                // *** NEW: Trigger input event for digraphs ***
                if(replaced) {
                    const inputEvent = new Event('input', { bubbles: true });
                    keyboardInput.dispatchEvent(inputEvent);
                }
            }


            // 5. Handle Single Character Mapping (if no digraph or shifted mapping was handled yet)
            if (insertedTifinaghChar === null) {
                const mappedChar = tifinaghMap[lowerKey];
                if (mappedChar) {
                    insertAtCursor(keyboardInput, mappedChar); // insertAtCursor already triggers 'input'
                    insertedTifinaghChar = mappedChar;
                } else {
                    // If no Tifinagh mapping, insert the original key (for numbers, unmapped punctuation, etc.)
                    // insertAtCursor will also trigger 'input'
                    insertAtCursor(keyboardInput, key);
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
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy'; // Assuming FontAwesome for icon
            }, 1500);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
            // *** NEW: Trigger input event for clear button too ***
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
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

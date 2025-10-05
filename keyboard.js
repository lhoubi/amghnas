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
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ',
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ', // Space key
        'enter': '\n' // Enter key
    };

    const tifinaghShiftMap = {
        'A': 'ⵄ', // 'A' can also be used for 'ⴰ' if 'ⵄ' is less common for 'A'
        'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'K': 'ⴽ', 'L': 'ⵍ', 'N': 'ⵑ', // Added 'N' for Tifinagh letter N
        'M': 'ⴾ', // Example for 'M'
        // Add more shifted/capitalized mappings as needed for your specific Tifinagh layout.
        // For example, some layouts use 'E' for 'ⴻ', 'I' for 'ⵉ', etc.
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted
    // Ensure this map covers ALL characters in tifinaghMap and tifinaghShiftMap
    const tifinaghKeyToVirtualDataKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', // Added missing Tifinagh characters that are in your virtual keyboard
        'ⵑ': 'ⵑ', 'ⴾ': 'ⴾ', // Added for the example Shifted N/M
        ' ': ' ',
        'backspace': 'backspace',
        '\n': 'enter' // Although not a key, it's good for internal consistency if needed
    };


    // Function to insert text at the cursor position (and trigger input event)
    function insertAtCursor(field, text) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const value = field.value;

        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;

        // Trigger 'input' event manually for other listeners (e.g., converter.js)
        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);

        // Crucial: Manually set and then blur focus for mobile 'readonly' input.
        // This ensures the cursor is where it should be but doesn't trigger native keyboard.
        field.focus();
        // A slight delay might be needed on some devices to ensure focus is "registered" before blur,
        // but typically direct blur works with readonly.
        if (document.activeElement === field) {
             field.blur();
        }
    }

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghDataKey) {
        const virtualKeyToSelect = tifinaghKeyToVirtualDataKeyMap[tifinaghDataKey] || tifinaghDataKey;
        const matchingKey = document.querySelector(`.keyboard-key[data-key="${virtualKeyToSelect}"]`);
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
                // For regular keys, insert the character defined by data-key
                insertAtCursor(keyboardInput, keyValue);
                highlightKey(keyValue);
            }
            // After inserting, explicitly ensure the actual text area doesn't have focus
            // to prevent accidental native keyboard pop-ups on some devices.
            keyboardInput.blur();
        });
    });

    // --- Physical Keyboard Input Handling ---
    // This listener is now primarily for desktop users. On mobile, the 'readonly'
    // attribute on the textarea should prevent this from firing in most browsers.
    keyboardInput.addEventListener('keydown', (e) => {
        // Since the textarea is readonly, the keydown event is still captured,
        // but we'll prevent default for almost everything to control input.

        // If you want to allow native text input for some reason (e.g. for desktop users
        // to directly type in the box, and only use virtual keyboard on mobile),
        // you would need to implement complex logic to differentiate mobile vs. desktop
        // or toggle readonly based on device. For simplicity, we assume this is a
        // virtual-keyboard-first experience.

        e.preventDefault(); // Crucial: Prevent default input into the readonly textarea

        const currentCursorPos = keyboardInput.selectionStart;
        const precedingChar = keyboardInput.value.substring(currentCursorPos - 1, currentCursorPos).toLowerCase();
        const key = e.key; // Get the pressed key as is (to differentiate 'g' from 'G')

        // 1. Handle Backspace key
        if (key === 'Backspace') {
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
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
            return;
        }

        // 2. Ignore Modifier Keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab') {
            return;
        }

        // 3. Handle Enter/Return Key
        if (key === 'Enter') {
            insertAtCursor(keyboardInput, '\n');
            return;
        }

        let insertedTifinaghChar = null;
        const lowerKey = key.toLowerCase();

        // --- Handle Shifted/Capitalized Mappings FIRST ---
        const isShiftedOrCaps = e.shiftKey || e.getModifierState('CapsLock');
        if (isShiftedOrCaps && tifinaghShiftMap[key]) {
            insertAtCursor(keyboardInput, tifinaghShiftMap[key]);
            insertedTifinaghChar = tifinaghShiftMap[key];
        } else {
            // --- Handle Digraphs (two-key combinations) ---
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
                } else if (lowerKey === 's' && precedingChar === 't') { // ts
                    keyboardInput.value = keyboardInput.value.substring(0, currentCursorPos - 1) + 'ⵚ' + keyboardInput.value.substring(currentCursorPos);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                    insertedTifinaghChar = 'ⵚ'; replaced = true;
                }
                // Trigger input event for digraphs
                if (replaced) {
                    const inputEvent = new Event('input', { bubbles: true });
                    keyboardInput.dispatchEvent(inputEvent);
                }
            }


            // 5. Handle Single Character Mapping (if no digraph or shifted mapping was handled yet)
            if (insertedTifinaghChar === null) {
                const mappedChar = tifinaghMap[lowerKey];
                if (mappedChar) {
                    insertAtCursor(keyboardInput, mappedChar);
                    insertedTifinaghChar = mappedChar;
                } else {
                    // If no Tifinagh mapping, insert the original key (for numbers, unmapped punctuation, etc.)
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
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 1500);
            keyboardInput.blur(); // Remove focus after copying
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            // No need to focus then blur for clear, as input is empty and not "active"
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent);
            keyboardInput.blur(); // Ensure no lingering focus
        });
    }

    // --- Preventing Native Keyboard on Mobile (Important!) ---
    // This is the core fix for the "unidentified" characters issue.
    // By making the textarea readonly, we essentially tell the browser not to manage its input itself.
    // The following listeners ensure that even if a touch event somehow tries to open the native keyboard,
    // we immediately dismiss it or prevent it from fully appearing.

    keyboardInput.addEventListener('focus', (event) => {
        // On mobile, tapping a readonly input might still momentarily try to bring up the keyboard.
        // We immediately blur to dismiss it.
        event.preventDefault(); // Prevent default focus behavior
        if (document.activeElement === keyboardInput) {
            keyboardInput.blur();
        }
    });

    keyboardInput.addEventListener('click', (event) => {
        // For extra measure, especially on mobile.
        event.preventDefault();
        if (document.activeElement === keyboardInput) {
            keyboardInput.blur();
        }
    });

    // The 'touchend' event can also be useful for mobile touch devices
    keyboardInput.addEventListener('touchend', (event) => {
        event.preventDefault();
        if (document.activeElement === keyboardInput) {
            keyboardInput.blur();
        }
    });

    // Optional: Visual Cue for Textarea Focus (will only apply on desktop where actual focus might happen briefly)
    keyboardInput.addEventListener('mouseenter', () => {
        keyboardInput.classList.add('hovered'); // Add a hovered state for desktop
    });
    keyboardInput.addEventListener('mouseleave', () => {
        keyboardInput.classList.remove('hovered');
    });

    // Keeping a visual cue for desktop users where focus can persist
    keyboardInput.addEventListener('focusin', () => { // Use focusin for events that bubble
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('focusout', () => { // Use focusout
        keyboardInput.classList.remove('focused');
    });
});

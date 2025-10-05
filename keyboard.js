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
    // This map is primarily for physical keyboard input and the 'beforeinput' event.
    // It maps standard Latin characters to Tifinagh.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ',
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        // Common digraphs or special characters - these will be handled by look-ahead logic in keydown/beforeinput
        // These are kept here for reference but actual insertion logic handles combinations.
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', // Assuming 'dh' maps to 'ⴹ'
        'th': 'ⵜ', // Assuming 'th' maps to 'ⵜ'
        'ts': 'ⵚ',
        ' ': ' ', // Space key
        'enter': '\n' // Enter key
    };

    // --- Shifted/Capitalized Tifinagh Mapping ---
    // This map handles when Shift is pressed with a key, or if CapsLock is active for letter keys.
    const tifinaghShiftMap = {
        'A': 'ⵄ',
        'G': 'ⵖ', // Shift+G for GHO
        'H': 'ⵃ', // Shift+H for HHA
        'D': 'ⴹ', // Shift+D for DHA
        'T': 'ⵟ', // Shift+T for TTA
        'R': 'ⵕ', // Shift+R for RRA
        'S': 'ⵚ', // Shift+S for SSA
        'Z': 'ⵥ', // Shift+Z for ZZA
        'X': 'ⵅ', // Shift+X for KHA
        'C': 'ⵛ', // Shift+C for CHA
        'Q': 'ⵇ', // Shift+Q for QAF
        // Add more shifted/capitalized mappings as needed for other special Tifinagh characters
        'W': 'ⵯ', // Example: Shift+W for LABIALIZATION MARK
        // Note: For keys like 'ⴽ', 'ⵍ', 'ⵎ', 'ⵏ', etc., if there's no distinct shifted Tifinagh char,
        // you can omit them or map them to their unshifted Tifinagh equivalent if CapsLock is desired
        // to behave like regular typing for those.
    };

    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted.
    // Ensure this map covers ALL Tifinagh characters you expect to be inserted by any means.
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', // Added for comprehensive highlighting
        ' ': ' ',
        'backspace': 'backspace', // Special key for highlighting
        '\n': 'enter' // Special key for highlighting
    };


    // Function to insert text at the cursor position (and dispatch an input event)
    function insertAtCursor(field, text) {
        const start = field.selectionStart;
        const end = field.selectionEnd;
        const value = field.value;

        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;

        // Dispatch 'input' event to ensure any other listeners (e.g., for character counting or conversion) are notified
        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);

        field.focus(); // Keep focus on the textarea
    }

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghChar) {
        // Find the virtual key using the tifinaghChar to data-key mapping
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


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default button behavior (e.g., form submission)

            const keyValue = key.dataset.key; // Get the character from data-key attribute

            if (keyValue === 'backspace') {
                const start = keyboardInput.selectionStart;
                const end = keyboardInput.selectionEnd;
                if (start === end) { // No text selected, delete preceding character
                    if (start > 0) {
                        keyboardInput.value = keyboardInput.value.substring(0, start - 1) + keyboardInput.value.substring(end);
                        keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
                    }
                } else { // Text is selected, delete selected text
                    keyboardInput.value = keyboardInput.value.substring(0, start) + keyboardInput.value.substring(end);
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
                }
                highlightKey('backspace'); // Highlight virtual backspace key
                const inputEvent = new Event('input', { bubbles: true });
                keyboardInput.dispatchEvent(inputEvent); // Notify of change
            } else {
                insertAtCursor(keyboardInput, keyValue);
                highlightKey(keyValue);
            }
            keyboardInput.focus(); // Keep focus on the textarea
        });
    });


    // --- Physical Keyboard Input Handling (Desktop/Laptop) ---
    // This handles key presses from a physical keyboard, mapping Latin keys to Tifinagh.
    keyboardInput.addEventListener('keydown', (e) => {
        const currentCursorPos = keyboardInput.selectionStart;
        const precedingChar = keyboardInput.value.substring(currentCursorPos - 1, currentCursorPos).toLowerCase();
        const key = e.key;
        const lowerKey = key.toLowerCase();
        const isShifted = e.shiftKey || e.getModifierState('CapsLock');

        // 1. Handle Backspace key for physical keyboard
        if (key === 'Backspace') {
            // Virtual keyboard logic already handles this, but ensuring physical keyboard behavior
            // doesn't conflict or can be customized here.
            // For now, let default browser behavior for backspace occur if we don't preventDefault.
            // If you want to replicate the virtual backspace exactly, uncomment/modify:
            // e.preventDefault();
            // ... (copy backspace logic from virtual keyboard click handler here)
            highlightKey('backspace'); // Still highlight the virtual key
            return; // Exit to let browser handle default backspace or your manual handling above
        }

        // 2. Ignore Modifier Keys and other non-character keys
        // key.length > 1 generally means it's a special key like 'ArrowUp', 'F1', etc.
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab' || key.length > 1 && key !== 'Enter') {
            return;
        }

        // 3. Handle Enter Key
        if (key === 'Enter') {
            insertAtCursor(keyboardInput, '\n');
            e.preventDefault(); // Prevent default browser new line insertion
            highlightKey('\n'); // Highlight virtual enter key (if you add one)
            return;
        }

        let mappedChar = null;

        // --- Digraph Handling (e.g., 'gh' -> 'ⵖ') ---
        // This is a more advanced pattern and might require adjusting cursor position carefully.
        // For simplicity with `keydown`, we'll primarily rely on single key mappings first,
        // and let `beforeinput` handle the 'what character is about to be inserted' aspect.
        // If you need robust digraphs, consider a "look-ahead" buffer for multiple key presses.
        // For now, this section is mainly for shifted/single key mappings.

        // 4. Check Shifted/Capitalized mapping FIRST
        if (isShifted) {
            mappedChar = tifinaghShiftMap[key]; // Check directly for uppercase key
        }
        // 5. If not shifted or no shifted map, check regular mapping
        if (!mappedChar) {
            mappedChar = tifinaghMap[lowerKey];
        }

        // If a Tifinagh character is mapped, prevent default Latin input and insert Tifinagh
        if (mappedChar) {
            e.preventDefault(); // Stop the browser from inserting the default Latin character
            insertAtCursor(keyboardInput, mappedChar);
            highlightKey(mappedChar);
        } else {
            // If no Tifinagh mapping, allow the default key event to proceed.
            // This lets numbers, punctuation, and unmapped Latin characters appear as usual.
            // We can still try to highlight based on the actual key if it's a Tifinagh char itself
            // (e.g., if a native Tifinagh keyboard is active and types 'ⴳ' directly).
            highlightKey(key); // Attempt to highlight the key that was pressed.
        }
    });


    // --- Mobile Native Keyboard Override (using beforeinput event) ---
    // This is the primary mechanism to override default mobile keyboard input.
    keyboardInput.addEventListener('beforeinput', (e) => {
        // Only target character input (e.g., not 'deleteContentBackward' for backspace)
        if (e.inputType === 'insertText' && e.data) {
            const inputData = e.data;
            const isShifted = e.getModifierState('Shift') || e.getModifierState('CapsLock');
            let mappedChar = null;

            // Try shifted map first
            if (isShifted) {
                mappedChar = tifinaghShiftMap[inputData]; // e.g., 'A' -> 'ⵄ'
            }
            // If not found in shifted, try regular map with lowercase input
            if (!mappedChar) {
                mappedChar = tifinaghMap[inputData.toLowerCase()]; // e.g., 'g' -> 'ⴳ'
            }

            if (mappedChar) {
                e.preventDefault(); // STOP the browser from inserting its default character ('a', 'g', etc.)
                insertAtCursor(keyboardInput, mappedChar); // Manually insert our Tifinagh character
                highlightKey(mappedChar); // Highlight the corresponding virtual key
            } else {
                // If no Tifinagh mapping found for the inputData, allow the default browser behavior.
                // This means numbers, symbols, or unmapped Latin letters will be inserted normally.
                // You could add `highlightKey(inputData)` here if you want to highlight the
                // virtual key for non-Tifinagh characters too (if they exist on your virtual layout).
                highlightKey(inputData);
            }
        }
        // For other inputTypes like 'deleteContentBackward' (backspace), 'insertLineBreak' (enter),
        // we can let the browser handle them by default, or implement custom logic here if needed.
        // Your keydown already handles backspace for physical keyboards, and 'beforeinput' also fires
        // for backspace where `e.inputType` is 'deleteContentBackward'.
        if (e.inputType === 'deleteContentBackward') {
             highlightKey('backspace'); // Highlight virtual backspace key
        }
        if (e.inputType === 'insertLineBreak') {
            highlightKey('\n'); // Highlight virtual enter key
        }
    });

    // --- Action Buttons: Copy and Clear ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select(); // Select all text in the textarea
            // Use modern Clipboard API if available, fallback to execCommand
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
                        // Fallback to execCommand if Clipboard API fails or is not supported
                        document.execCommand('copy');
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 1500);
                    });
            } else {
                // Fallback for older browsers
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 1500);
            }
            keyboardInput.focus(); // Keep focus after copying
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus(); // Keep focus after clearing
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent); // Notify of change
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

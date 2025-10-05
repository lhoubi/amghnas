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
    // This map defines the Latin-to-Tifinagh conversions.
    // It's crucial for the real-time conversion logic.
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

    // --- Shifted/Capitalized Tifinagh Mapping ---
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
    };

    // --- Combined Map for Conversion ---
    // This map combines both regular and shifted mappings for easier lookup during conversion.
    // Capital letters will attempt to use their shifted mapping first.
    const combinedTifinaghMap = { ...tifinaghMap };
    for (const key in tifinaghShiftMap) {
        combinedTifinaghMap[key] = tifinaghShiftMap[key];
    }

    // Special handling for digraphs (two-character Latin sequences mapping to one Tifinagh char)
    // These need to be processed carefully to ensure the correct conversion.
    // Order matters here (longest matches first).
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
        // Add more digraphs if needed. E.g., 'z_h' if that maps to 'ⵥ'
    };


    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted.
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ',
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace'
    };

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghChar) {
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


    // --- Core Conversion Function (Latin to Tifinagh) ---
    // This function will convert an entire Latin string to Tifinagh.
    function convertLatinToTifinagh(latinText) {
        let tifinaghResult = '';
        let i = 0;
        while (i < latinText.length) {
            let foundMapping = false;

            // Try to match digraphs first (longest matches)
            for (const digraph in digraphMap) {
                if (latinText.substring(i, i + digraph.length).toLowerCase() === digraph) {
                    tifinaghResult += digraphMap[digraph];
                    i += digraph.length;
                    foundMapping = true;
                    break;
                }
            }

            if (!foundMapping) {
                // If no digraph, try single character mapping
                const char = latinText[i];
                let mappedChar = combinedTifinaghMap[char]; // Check for case-sensitive first (e.g., 'A' for shifted)
                if (!mappedChar) { // If no case-sensitive match, try lowercase
                    mappedChar = combinedTifinaghMap[char.toLowerCase()];
                }

                if (mappedChar) {
                    tifinaghResult += mappedChar;
                } else {
                    // If no Tifinagh mapping, keep the original character (e.g., numbers, punctuation)
                    tifinaghResult += char;
                }
                i++;
            }
        }
        return tifinaghResult;
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const keyValue = key.dataset.key;
            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            let newValue = keyboardInput.value;
            let newCursorPos = start;

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
                highlightKey('backspace');
            } else {
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
                highlightKey(keyValue);
            }

            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            const inputEvent = new Event('input', { bubbles: true });
            keyboardInput.dispatchEvent(inputEvent); // Trigger input event to ensure consistency
            keyboardInput.focus();
        });
    });


    // --- Real-time Conversion on Input ---
    // This is the core logic for physical keyboards (desktop) AND native mobile keyboards.
    // It captures whatever Latin text is input and immediately converts it to Tifinagh.
    let lastLatinInput = ''; // Store the last known Latin input state

    keyboardInput.addEventListener('input', (e) => {
        const currentCursorPos = keyboardInput.selectionStart;
        const currentInputValue = keyboardInput.value;

        // Determine if the input was a deletion (backspace/delete)
        const isDeletion = (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward' || e.inputType === 'deleteByCut');

        let latinSegment = '';
        let tifinaghSegment = '';
        let newCursorShift = 0;

        if (isDeletion) {
            // For deletions, simply re-convert the remaining text.
            // The browser has already handled the deletion.
            latinSegment = currentInputValue;
            tifinaghSegment = convertLatinToTifinagh(latinSegment);

            keyboardInput.value = tifinaghSegment;
            // Cursor position for deletion usually naturally moves backward or stays,
            // so we set it directly from the original deletion.
            keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;

            highlightKey('backspace'); // Still highlight backspace
        } else {
            // For insertions, figure out what was just typed in Latin.
            // We assume the new Latin characters were appended at the currentCursorPos - (change length).
            // This is a common pattern for 'input' events with native keyboards.
            const diffLength = currentInputValue.length - lastLatinInput.length;

            if (diffLength > 0) { // New characters were inserted
                const insertedLatin = currentInputValue.substring(currentCursorPos - diffLength, currentCursorPos);

                // Convert the newly inserted Latin characters to Tifinagh
                const convertedInsertedTifinagh = convertLatinToTifinagh(insertedLatin);

                // Build the new value by replacing the Latin insert with its Tifinagh equivalent
                const beforeCursor = currentInputValue.substring(0, currentCursorPos - diffLength);
                const afterCursor = currentInputValue.substring(currentCursorPos);

                // Convert the parts *before* and *after* the new insertion to Tifinagh
                // This is important for ensuring digraphs are handled correctly if they span the insertion point.
                const fullyConvertedText = convertLatinToTifinagh(beforeCursor + insertedLatin + afterCursor);

                // Now, we need to carefully set the value and the cursor.
                // The safest way is to re-convert the whole string and then calculate the new cursor position.
                const oldFullTifinagh = convertLatinToTifinagh(lastLatinInput);

                // Calculate where the cursor *should* be in the Tifinagh string after conversion.
                // This is tricky: we need to map the original Latin cursor position to the new Tifinagh string.
                // A simplified approach is to re-convert up to the Latin cursor position
                // to find the Tifinagh equivalent length.
                const latinPrefix = lastLatinInput.substring(0, currentCursorPos - diffLength);
                const newTifinaghPrefix = convertLatinToTifinagh(latinPrefix);

                // The new cursor position will be the length of the converted prefix + the length of the *newly converted* inserted chars.
                newCursorShift = newTifinaghPrefix.length + convertedInsertedTifinagh.length;

                keyboardInput.value = fullyConvertedText;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorShift;

                // Attempt to highlight the last Tifinagh character inserted
                if (convertedInsertedTifinagh.length > 0) {
                    highlightKey(convertedInsertedTifinagh[convertedInsertedTifinagh.length - 1]);
                } else if (insertedLatin.length > 0) {
                     // If Latin char didn't convert to Tifinagh, highlight the Latin char itself if it exists
                    highlightKey(insertedLatin[insertedLatin.length - 1]);
                }

            } else {
                // This case handles pasting or other complex input types where `diffLength` isn't simple.
                // Re-convert the entire content.
                const converted = convertLatinToTifinagh(currentInputValue);
                if (keyboardInput.value !== converted) { // Only update if necessary to avoid cursor jumps
                    keyboardInput.value = converted;
                    // For complex changes, cursor position is harder. Keep it at end or current unless specific logic.
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = currentCursorPos;
                }
            }
        }
        // Update lastLatinInput for the next comparison
        lastLatinInput = currentInputValue;
    });

    // --- Physical Keyboard Keydown (for Backspace only, to prevent default browser action if desired) ---
    // The main conversion logic is now in 'input', but 'keydown' is still useful for special keys.
    keyboardInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            // Prevent default backspace, as the 'input' event listener handles the content change.
            // This ensures our 'input' listener gets a 'deleteContentBackward' and re-processes.
            // If you want default browser backspace to work, remove this preventDefault().
            e.preventDefault();
            // Manually trigger deletion through input event to be handled by the 'input' listener
            document.execCommand('deleteBackward', false, null);
            highlightKey('backspace');
        } else if (e.key === 'Enter') {
            // Allow default 'Enter' to insert a newline, then 'input' will convert if needed.
            // Or you can prevent default and insert your own '\n'.
            // For now, allowing default for Enter, as '\n' is in tifinaghMap.
            highlightKey('\n');
        }
    });


    // --- Action Buttons: Copy and Clear ---
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
                document.execCommand('copy'); // Fallback for older browsers
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
            lastLatinInput = ''; // Reset the last Latin input tracker
            keyboardInput.focus();
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

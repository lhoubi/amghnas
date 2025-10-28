document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return;
    }

    // --- Tifinagh Mapping (for Latin input - all lowercase base characters) ---
    // This map should contain the base Tifinagh for standard lowercase Latin letters.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ' // Space key
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for distinct shifted outputs) ---
    // Only put capital letters here if they map to a *different* Tifinagh character than their lowercase.
    // E.g., 'A' -> 'ⵄ' (different from 'a' -> 'ⴰ')
    const tifinaghShiftMap = {
        'A': 'ⵄ', // as per HTML
        'G': 'ⵖ', // assuming G might also be gh
        'H': 'ⵃ', // as per HTML for ḥ
        'D': 'ⴹ', // as per HTML for ḍ
        'T': 'ⵟ', // as per HTML for ṭ
        'R': 'ⵕ', // as per HTML for Ṛ
        'S': 'ⵚ', // as per HTML for ṣ
        'Z': 'ⵥ', // as per HTML for ẓ
        'X': 'ⵅ', // if X is intended for kh
        'C': 'ⵛ', // as per HTML
        'Q': 'ⵇ', // if Q is intended for q
        'W': 'ⵯ', // as per HTML for ʷ
        // The HTML for L and C in row 1 and 3 are just labels, not necessarily unique mappings.
        // We ensure 'l' maps to 'ⵍ' and 'c' maps to 'ⵛ' in tifinaghMap.
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    // Ensure these are all lowercase for consistent matching.
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
        // Add more if needed, e.g., 'zh' for 'ⵥ' if applicable
    };

    // --- Arabic to Tifinagh Mapping ---
    // Ensure completeness based on your HTML labels.
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', 'إ': 'ⵉ', 'أُ': 'ⵓ',
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ',
        'ط': 'ⵟ', 'ظ': 'ⵥ', // assuming ظ -> ⵥ as per common mapping
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ', // Default 'ك' to 'ⴽ'
        'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', 'ى': 'ⵉ', // These map to vowels
        'ء': 'ⴻ', // Assuming ء maps to a neutral vowel 'ⴻ'
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',

        ' ': ' ',
        '\n': '\n',
        'ـ': 'ـ', // Arabic Tatweel for ʷ
        'ڤ': 'ⵠ', // Added for 'v'
        'ڭ': 'ⴳ', // Added for 'g'
        // Specific 'ك' mapping for ⵛ, as seen in HTML
        // This is tricky. If 'ك' can be 'ⴽ' OR 'ⵛ', you need a rule.
        // For now, I'll assume standard 'ك' -> 'ⴽ', and 'C' key maps explicitly to 'ⵛ'.
        // If an Arabic 'ك' should sometimes be 'ⵛ', it might need a shifted Arabic input or context.
        // Based on your HTML: <span class="arabic-label">ك</span> <button class="keyboard-key" data-key="ⵛ">
        // This implies 'ك' can also map to 'ⵛ'. Let's add it carefully.
        'ك_for_C': 'ⵛ' // Special temporary entry, handled in convertCharToTifinagh
    };

    /**
     * Activates the 'fire-active' animation on a given key element.
     * @param {HTMLElement} keyElement The virtual keyboard button to animate.
     */
    function activateKeyAnimation(keyElement) {
        if (keyElement) {
            keyElement.classList.remove('fire-active');
            // This line forces a reflow, allowing the animation to restart even if the class is re-added quickly.
            void keyElement.offsetWidth;
            keyElement.classList.add('fire-active');
            setTimeout(() => {
                keyElement.classList.remove('fire-active');
            }, 300);
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
                // Check if label exists and text content matches searchKey
                if (arabicLabel && arabicLabel.textContent === searchKey) {
                    // Special handling for the 'ك' that maps to 'ⵛ'
                    if (searchKey === 'ك' && key.dataset.key === 'ⵛ') {
                        return key;
                    }
                    // For general Arabic mapping
                    if (key.dataset.key === arabicToTifinaghMap[searchKey]) {
                        return key;
                    }
                }
            }
        }
        return null;
    }

    function isArabicChar(char) {
        if (!char) return false;
        // Extend to cover more specific Arabic diacritics if necessary.
        return char.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/);
    }

    function isLatinChar(char) {
        if (!char) return false;
        // Basic Latin alphabet, including some common extended Latin characters if needed
        return char.match(/[a-zA-Z\u00C0-\u017F]/);
    }

    // --- Core Conversion Logic for Physical Keyboard Input ---
    function convertCharToTifinagh(inputChar) {
        // 1. Try exact match in shifted Latin (e.g., 'A' -> 'ⵄ')
        if (tifinaghShiftMap[inputChar] !== undefined) {
            return tifinaghShiftMap[inputChar];
        }
        // 2. Try exact match for Arabic (e.g., 'ا' -> 'ⴰ')
        if (isArabicChar(inputChar)) {
             // Handle 'ك' specifically if it should map to 'ⵛ' in certain contexts
             if (inputChar === 'ك' && arabicToTifinaghMap['ك_for_C'] !== undefined) {
                 // This is a heuristic. In a real scenario, you might need a modifier key for this.
                 // For now, if 'ك' is typed, we can prioritize the 'ⵛ' if it's explicitly desired.
                 // Or, if it's meant to be default 'ⴽ', then don't put 'ك_for_C' in map.
                 // Given your HTML for C -> ⵛ, it means if Arabic 'ك' is typed, it should yield ⵛ.
                 return arabicToTifinaghMap['ك_for_C'];
             }
            if (arabicToTifinaghMap[inputChar] !== undefined) {
                return arabicToTifinaghMap[inputChar];
            }
        }
        // 3. Try lowercase Latin (e.g., 'a' -> 'ⴰ', 'L' -> 'ⵍ')
        if (isLatinChar(inputChar)) {
            const lowerChar = inputChar.toLowerCase();
            if (tifinaghMap[lowerChar] !== undefined) {
                return tifinaghMap[lowerChar];
            }
        }
        // 4. Handle space and newline directly if they somehow bypass other maps
        if (inputChar === ' ') return ' ';
        if (inputChar === '\n') return '\n';

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
                deleteAtCursor(keyboardInput, 1);
            } else if (keyValue === 'enter') {
                insertAtCursor(keyboardInput, '\n');
            } else {
                insertAtCursor(keyboardInput, keyValue);
            }
            
            keyboardInput.focus();
            activateKeyAnimation(key); // Activate animation for clicked key
        });
    });

    let pendingDigraphChar = ''; // Stores the first char of a potential digraph

    // --- Keydown event listener for animations and conversion logic ---
    keyboardInput.addEventListener('keydown', (e) => {
        // --- Animate virtual key ---
        let keyToAnimate = null;
        if (e.key === 'Enter') {
            keyToAnimate = findVirtualKeyElement('enter');
        } else if (e.key === 'Backspace') {
            keyToAnimate = findVirtualKeyElement('backspace');
        } else if (e.key === ' ') {
            keyToAnimate = findVirtualKeyElement(' ', 'tifinagh');
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Priority 1: Animate based on direct input char if it maps to a virtual key's Latin/Arabic label
            keyToAnimate = findVirtualKeyElement(e.key, isLatinChar(e.key) ? 'latin' : 'arabic');
            
            // If no direct label match, try to find the Tifinagh result and animate that key
            if (!keyToAnimate) {
                const potentialTifinagh = convertCharToTifinagh(e.key);
                if (potentialTifinagh) {
                    keyToAnimate = findVirtualKeyElement(potentialTifinagh, 'tifinagh');
                }
            }
            
            // For digraphs, if a digraph is formed, we want to animate the resulting Tifinagh char key
            // This is handled later in the conversion logic to ensure the correct final character is animated.
        }

        if (keyToAnimate) {
            activateKeyAnimation(keyToAnimate);
        }

        // --- Core conversion logic for physical character keys ---
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const inputChar = e.key;
            let charHandled = false;

            // 1. Digraph Handling: Check if the current char completes a pending digraph
            if (pendingDigraphChar) {
                const potentialDigraph = (pendingDigraphChar + inputChar).toLowerCase();
                const digraphResult = digraphMap[potentialDigraph];
                
                if (digraphResult) {
                    e.preventDefault(); // Prevent current char from being inserted
                    deleteAtCursor(keyboardInput, 1); // Delete the temporarily inserted pendingDigraphChar
                    insertAtCursor(keyboardInput, digraphResult); // Insert the Tifinagh digraph
                    charHandled = true;
                    pendingDigraphChar = ''; // Clear pending, as a full digraph was formed
                    
                    // Animate the resulting Tifinagh digraph character
                    let digraphKey = findVirtualKeyElement(digraphResult, 'tifinagh');
                    if (digraphKey) activateKeyAnimation(digraphKey);

                } else {
                    // If current char doesn't form a digraph with pendingDigraphChar,
                    // the pendingDigraphChar should be treated as a single character
                    // (it was already inserted by the browser in the previous keydown)
                    // and we now convert the current inputChar as a single character.
                    pendingDigraphChar = ''; // Reset, as no digraph was formed.
                    // Fall through to single character conversion for current inputChar.
                }
            }

            // 2. Single Character Conversion: If not handled by digraph, try single char conversion
            if (!charHandled) {
                const convertedChar = convertCharToTifinagh(inputChar);

                if (convertedChar) { // If a Tifinagh equivalent was found
                    // Check if this character could START a digraph.
                    let couldStartDigraph = false;
                    for (const digraphPrefix in digraphMap) {
                        if (digraphPrefix.startsWith(inputChar.toLowerCase()) && digraphPrefix.length > 1) {
                            couldStartDigraph = true;
                            break;
                        }
                    }

                    if (couldStartDigraph) {
                        pendingDigraphChar = inputChar;
                        // Allow browser to insert the character temporarily. This character will be deleted
                        // if a digraph is formed, or kept if no digraph is formed.
                        // We still prevent default if it's a direct single char map to avoid double insertion.
                        if (!tifinaghMap[inputChar.toLowerCase()] && !tifinaghShiftMap[inputChar]) {
                           // If it's a potential digraph start AND not a direct single char, let it pass for now
                           // This is the tricky part to manage if you want a visual pending state or direct conversion.
                           // For "direct to tifinagh" as requested, we generally prevent default.
                           // We will prevent default here, and if a digraph is meant to be formed,
                           // the pendingChar logic will handle deleting and re-inserting.
                            e.preventDefault();
                            insertAtCursor(keyboardInput, convertedChar);
                            // The above makes `pendingDigraphChar` problematic as the base character is already Tifinagh.
                            // Re-evaluating: To keep "direct to Tifinagh" AND handle digraphs:
                            // We need to allow the Latin character to be inserted temporarily to check for digraphs.
                            // OR, implement a buffer.
                            // Let's go with a simpler direct replacement and remove complex digraph pre-buffering.

                            // Re-implementation for direct Tifinagh and simple digraph:
                            // On keydown, check for 2-char digraph first.
                            // If `pendingDigraphChar` exists, combine `previousValue.slice(-1)` with `inputChar`.
                            // If it forms a digraph, delete last char, insert digraph char.
                            // Else, `previousValue.slice(-1)` becomes the single conversion, then convert `inputChar`.

                            // New strategy for `keydown`:
                            // 1. If `inputChar` is part of `digraphMap` AND the `lastChar` of `keyboardInput.value`
                            //    matches the prefix, then it's a digraph.
                            //    - `e.preventDefault()`
                            //    - Delete `lastChar`
                            //    - Insert `digraphResult`
                            //    - Animate `digraphResult`
                            // 2. Else (not a digraph, or `lastChar` not a prefix), treat `inputChar` as single char.
                            //    - `e.preventDefault()`
                            //    - Convert `inputChar` to `convertedChar`
                            //    - Insert `convertedChar`
                            //    - Animate `convertedChar`

                        } else {
                            e.preventDefault(); // Prevent the browser from inserting the original char
                            insertAtCursor(keyboardInput, convertedChar); // Insert the Tifinagh char
                            pendingDigraphChar = ''; // No pending char needed for direct conversion
                        }
                    } else {
                        e.preventDefault(); // Prevent the browser from inserting the original char
                        insertAtCursor(keyboardInput, convertedChar); // Insert the Tifinagh char
                        pendingDigraphChar = ''; // No pending char needed for direct conversion
                    }
                } else {
                    // No Tifinagh conversion found. Allow browser default (e.g., numbers, symbols, unmapped chars)
                    pendingDigraphChar = '';
                }
            }
        } else {
            // For non-character keys, clear pending digraph state
            pendingDigraphChar = '';
        }
    });

    // --- REVISED Keydown event listener for animations and conversion logic ---
    // This revised logic aims to handle direct conversion and digraphs more cleanly.
    keyboardInput.removeEventListener('keydown', (e) => {}); // Remove previous listener if it exists
    keyboardInput.addEventListener('keydown', (e) => {
        const currentInputValue = keyboardInput.value;
        const cursorPosition = keyboardInput.selectionStart;

        // Skip if it's a control key or non-character input
        if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
            // Animate special keys like Enter, Backspace, Space
            let keyToAnimate = null;
            if (e.key === 'Enter') keyToAnimate = findVirtualKeyElement('enter');
            else if (e.key === 'Backspace') keyToAnimate = findVirtualKeyElement('backspace');
            else if (e.key === ' ') keyToAnimate = findVirtualKeyElement(' ', 'tifinagh');
            if (keyToAnimate) activateKeyAnimation(keyToAnimate);
            return; // Exit if it's not a character key
        }

        const inputChar = e.key;
        let tifinaghToInsert = null;
        let charsToDelete = 0; // Number of characters to delete before inserting

        // 1. Check for Digraphs
        if (cursorPosition > 0) {
            const lastCharInInput = currentInputValue.substring(cursorPosition - 1, cursorPosition);
            const potentialDigraphLatin = (lastCharInInput + inputChar).toLowerCase();

            if (digraphMap[potentialDigraphLatin]) {
                tifinaghToInsert = digraphMap[potentialDigraphLatin];
                charsToDelete = 1; // Delete the last character that formed the first part of the digraph
            }
        }

        // 2. If not a digraph, try single character conversion
        if (!tifinaghToInsert) {
            tifinaghToInsert = convertCharToTifinagh(inputChar);
        }

        if (tifinaghToInsert) {
            e.preventDefault(); // Prevent default browser character insertion

            if (charsToDelete > 0) {
                deleteAtCursor(keyboardInput, charsToDelete);
            }
            insertAtCursor(keyboardInput, tifinaghToInsert);

            // Animate the corresponding virtual key
            let keyToAnimate = findVirtualKeyElement(tifinaghToInsert, 'tifinagh');
            // If the inputChar itself has a Latin/Arabic label that matches a key, animate that too.
            // This prioritizes the source key if it exists, otherwise animates the Tifinagh result.
            let sourceKeyToAnimate = findVirtualKeyElement(inputChar, isLatinChar(inputChar) ? 'latin' : 'arabic');
            
            if (sourceKeyToAnimate) {
                activateKeyAnimation(sourceKeyToAnimate);
            } else if (keyToAnimate) {
                activateKeyAnimation(keyToAnimate);
            }
        }
        // If tifinaghToInsert is null, it means no conversion was found, so allow default browser behavior
        // (e.g., for numbers, symbols, or unmapped characters). No prevention of default.
    });


    // The 'input' event listener is truly passive for physical keyboard character inputs.
    keyboardInput.addEventListener('input', () => {
        // This is primarily for non-keydown inputs (like paste) or to ensure `previousValue` is current.
        // `previousValue` is no longer directly used in conversion, but kept for general tracking if needed elsewhere.
        // It's removed from the context of digraph `pendingDigraphChar` as that logic is now inline in keydown.
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
            // previousValue = ''; // Not directly used in new logic, but harmless to clear.
            // pendingDigraphChar = ''; // Not directly used in new logic, but harmless to clear.
        });
    }

    // --- Focus and Blur handling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
        // previousValue = keyboardInput.value; // Not directly used in new logic.
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
        // pendingDigraphChar = ''; // Not directly used in new logic.
    });

    // Initialize previousValue on page load after all setup
    // previousValue = keyboardInput.value; // Not directly used in new logic.
});

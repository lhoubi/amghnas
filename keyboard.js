document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key'); // All Tifinagh buttons
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle'); // Added for theme toggle
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');


    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return;
    }

    // --- Tifinagh Mapping (for Latin input - all lowercase base characters) ---
    // This map covers the basic lowercase Latin to Tifinagh.
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ' // Space key
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for distinct shifted outputs) ---
    // These are for specific capital Latin letters that map to a *different* Tifinagh char.
    // e.g., 'D' -> 'ⴹ', not 'ⴷ'
    const tifinaghShiftMap = {
        'A': 'ⵄ', // as per HTML
        'G': 'ⵖ', // for 'gh' or 'ɣ'
        'H': 'ⵃ', // for 'ḥ'
        'D': 'ⴹ', // for 'ḍ'
        'T': 'ⵟ', // for 'ṭ'
        'R': 'ⵕ', // for 'ṛ'
        'S': 'ⵚ', // for 'ṣ'
        'Z': 'ⵥ', // for 'ẓ'
        'C': 'ⵛ', // as per HTML (if 'C' is distinct from 'c')
        'W': 'ⵯ', // for 'ʷ'
        // 'Q' could be ⵇ if that's a different Tifinagh for Q than 'q'
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    // These should represent sequences of Latin chars that become a single Tifinagh char.
    const digraphMap = {
        'gh': 'ⵖ', // ⵖ
        'kh': 'ⵅ', // ⵅ
        'ch': 'ⵛ', // ⵛ
        'sh': 'ⵛ', // ⵛ
        'dh': 'ⴹ', // ⴹ
        // 'th': 'ⵜ', // 'th' often just maps to 't'
        // 'ts': 'ⵚ', // 'ts' can be 'ṣ'
        'gl': 'ⴳⵍ', // Example if you want 'gl' to map to a sequence
    };

    // --- Arabic to Tifinagh Mapping ---
    // Ensure this is comprehensive and accurate to your desired Arabic-Tifinagh conversions.
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', 'إ': 'ⵉ', 'أُ': 'ⵓ',
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ',
        'ط': 'ⵟ', 'ظ': 'ⵥ',
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ',
        'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', 'ى': 'ⵉ',
        'ء': 'ⴻ',
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        ' ': ' ',
        '\n': '\n',
        'ـ': 'ⵯ',
        'ڤ': 'ⵠ',
        'ڭ': 'ⴳ',
    };

    /**
     * Activates the 'fire-active' animation on a given key element.
     * @param {HTMLElement} keyElement The virtual keyboard button to animate.
     */
    function activateKeyAnimation(keyElement) {
        if (keyElement) {
            // Remove the class first to ensure the animation restarts
            keyElement.classList.remove('fire-active');
            // Trigger reflow to restart CSS animation
            void keyElement.offsetWidth;
            keyElement.classList.add('fire-active');
            // Remove the class after the animation duration (0.3s as per CSS)
            setTimeout(() => {
                keyElement.classList.remove('fire-active');
            }, 300);
        }
    }

    /**
     * Finds a virtual key element based on its data-key (Tifinagh char) or a label.
     * @param {string} searchKey The Tifinagh char, 'backspace', 'space', or a Latin/Arabic char label.
     * @param {string} [type='tifinagh'] 'tifinagh', 'latin', or 'arabic' to search by label.
     * @returns {HTMLElement|null} The matching key element or null.
     */
    function findVirtualKeyElement(searchKey, type = 'tifinagh') {
        // Handle special keys first based on their data-key
        if (searchKey === 'backspace') {
            return document.querySelector(`.keyboard-key[data-key="backspace"]`);
        }
        if (searchKey === ' ' || searchKey === 'SPACE') { // Handle both space character and 'SPACE' label
            return document.querySelector(`.keyboard-key[data-key=" "]`);
        }
        // If you had an 'Enter' key:
        // if (searchKey === 'Enter') {
        //     return document.querySelector(`.keyboard-key[data-key="enter"]`);
        // }

        // Search by Tifinagh data-key (most direct for virtual keyboard chars)
        if (type === 'tifinagh') {
            const keyElement = document.querySelector(`.keyboard-key[data-key="${searchKey}"]`);
            if (keyElement) return keyElement;
        }

        // Search by label (Latin or Arabic)
        // Iterate through all key-group elements to find a match in their labels
        for (const keyGroup of document.querySelectorAll('.key-group')) {
            const button = keyGroup.querySelector('.keyboard-key');
            if (!button) continue; // Skip if no button inside group

            if (type === 'latin') {
                const latinLabel = keyGroup.querySelector('.latin-label');
                if (latinLabel && latinLabel.textContent.trim().toLowerCase() === searchKey.toLowerCase()) {
                    return button;
                }
            } else if (type === 'arabic') {
                const arabicLabel = keyGroup.querySelector('.arabic-label');
                if (arabicLabel && arabicLabel.textContent.trim() === searchKey) {
                    return button;
                }
            }
        }
        return null; // No matching key found
    }

    function isArabicChar(char) {
        if (!char) return false;
        // Comprehensive Arabic Unicode ranges
        return char.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    }

    function isLatinChar(char) {
        if (!char) return false;
        // Basic Latin and common extended Latin (for diacritics like ḍ, ḥ, ṭ, ṛ, ṣ, ẓ)
        return char.match(/[a-zA-Z\u00C0-\u017F\u0180-\u024F\u1E00-\u1EFF\u1EE0-\u1EF9]/);
    }

    /**
     * Converts a single input character (Latin or Arabic) to its Tifinagh equivalent.
     * Prioritizes shifted Latin, then basic Latin, then Arabic.
     * @param {string} inputChar The character to convert.
     * @returns {string|null} The Tifinagh character or null if no conversion.
     */
    function convertSingleCharToTifinagh(inputChar) {
        // 1. Try exact match in shifted Latin (e.g., 'D' -> 'ⴹ')
        if (tifinaghShiftMap[inputChar] !== undefined) {
            return tifinaghShiftMap[inputChar];
        }

        // 2. Try lowercase Latin (e.g., 'a' -> 'ⴰ', 'L' -> 'ⵍ')
        if (isLatinChar(inputChar)) {
            const lowerChar = inputChar.toLowerCase();
            if (tifinaghMap[lowerChar] !== undefined) {
                return tifinaghMap[lowerChar];
            }
        }

        // 3. Try exact match for Arabic (e.g., 'ا' -> 'ⴰ')
        if (isArabicChar(inputChar)) {
            if (arabicToTifinaghMap[inputChar] !== undefined) {
                return arabicToTifinaghMap[inputChar];
            }
        }
        
        // 4. Handle space and newline directly if they bypass other maps
        if (inputChar === ' ') return ' ';
        if (inputChar === '\n') return '\n';

        return null; // No conversion found
    }

    // Helper to insert text at the current cursor position
    function insertAtCursor(textarea, textToInsert) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + textToInsert + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        // Ensure the input area retains focus after insertion
        textarea.focus();
    }

    // Helper to delete characters at the current cursor position (backwards)
    function deleteAtCursor(textarea, length) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        if (start === end) { // No selection, delete backwards from cursor
            if (start >= length) {
                textarea.value = value.substring(0, start - length) + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start - length;
            }
        } else { // There's a selection, delete the selection
            textarea.value = value.substring(0, start) + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start;
        }
        textarea.focus();
    }

    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default button behavior (like form submission)

            const keyValue = key.dataset.key; // The Tifinagh character or "backspace"

            if (keyValue === 'backspace') {
                deleteAtCursor(keyboardInput, 1);
            } else {
                insertAtCursor(keyboardInput, keyValue);
            }

            activateKeyAnimation(key); // Activate animation for the clicked virtual key
        });
    });

    // --- Physical Keyboard Input (keydown event) ---
    keyboardInput.addEventListener('keydown', (e) => {
        // --- 1. Handle special non-character keys (Backspace, Enter, Tab, Arrow keys etc.) ---
        let keyToAnimateSpecial = null;
        if (e.key === 'Backspace') {
            keyToAnimateSpecial = findVirtualKeyElement('backspace');
            e.preventDefault(); // Prevent default browser backspace
            deleteAtCursor(keyboardInput, 1);
        } else if (e.key === 'Enter') {
            // If you have a virtual 'enter' key, animate it
            // keyToAnimateSpecial = findVirtualKeyElement('enter'); 
            e.preventDefault(); // Prevent default browser new line
            insertAtCursor(keyboardInput, '\n');
        } else if (e.key === ' ') { // Spacebar
            keyToAnimateSpecial = findVirtualKeyElement(' '); // Search for the spacebar button
            e.preventDefault(); // Prevent default browser space
            insertAtCursor(keyboardInput, ' ');
        }
        // Add more special keys if needed (e.g., Tab for a specific Tifinagh character)

        if (keyToAnimateSpecial) {
            activateKeyAnimation(keyToAnimateSpecial);
            return; // Exit as special key handled
        }

        // --- 2. Ignore modifier keys and other non-typing keys ---
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) { // e.key.length > 1 catches F-keys, arrows, Shift etc.
            return; 
        }

        // --- 3. Process actual character input for conversion and animation ---
        const inputChar = e.key; // The character typed on the physical keyboard
        const currentInputValue = keyboardInput.value;
        const cursorPosition = keyboardInput.selectionStart;

        let tifinaghToInsert = null;
        let charsToDelete = 0; // How many previous characters to delete for a digraph

        // Digraph check: Look for a potential digraph formed by previous char + current char
        // Ensure there's a character before the cursor for digraph consideration
        if (cursorPosition > 0) {
            const charBeforeCursor = currentInputValue.substring(cursorPosition - 1, cursorPosition);
            const potentialDigraph = (charBeforeCursor + inputChar).toLowerCase();

            // Check if this potentialDigraph is in our digraphMap
            if (digraphMap[potentialDigraph]) {
                tifinaghToInsert = digraphMap[potentialDigraph];
                charsToDelete = 1; // We will replace the `charBeforeCursor`
            }
        }

        // If no digraph found or not applicable, try single character conversion
        if (tifinaghToInsert === null) {
            tifinaghToInsert = convertSingleCharToTifinagh(inputChar);
        }
        
        if (tifinaghToInsert !== null) {
            e.preventDefault(); // Crucial: Stop the browser from inserting the original `inputChar`

            if (charsToDelete > 0) {
                deleteAtCursor(keyboardInput, charsToDelete); // Remove the previous Latin char
            }
            insertAtCursor(keyboardInput, tifinaghToInsert); // Insert the Tifinagh equivalent

            // --- Animate the corresponding virtual key ---
            let keyToAnimate = findVirtualKeyElement(tifinaghToInsert, 'tifinagh'); // Try to animate the Tifinagh char

            // Fallback for animation: if Tifinagh button not found, try by Latin/Arabic label
            if (!keyToAnimate) {
                if (isLatinChar(inputChar)) {
                    keyToAnimate = findVirtualKeyElement(inputChar, 'latin');
                } else if (isArabicChar(inputChar)) {
                    keyToAnimate = findVirtualKeyElement(inputChar, 'arabic');
                }
            }

            if (keyToAnimate) {
                activateKeyAnimation(keyToAnimate);
            }
        }
        // If tifinaghToInsert is null, it means no conversion was found.
        // In this case, e.preventDefault() was not called, so the browser will insert the original `inputChar`
        // (e.g., numbers, punctuation not in maps, etc.), which is usually desired behavior.
    });


    // --- Copy and Clear button functionality ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select(); // Selects all text in the textarea
            
            // Modern way to copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keyboardInput.value)
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!'; // Change icon and text
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text'; // Reset button
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text using Clipboard API:', err);
                        // Fallback to deprecated execCommand for older browsers or HTTP
                        try {
                            document.execCommand('copy');
                            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            setTimeout(() => {
                                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text';
                            }, 1500);
                        } catch (execErr) {
                            console.error('Fallback copy failed:', execErr);
                            alert('Failed to copy text. Please copy manually.');
                        }
                    });
            } else {
                // Fallback for very old browsers where Clipboard API is not available
                try {
                    document.execCommand('copy');
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text';
                    }, 1500);
                } catch (execErr) {
                    console.error('Fallback copy failed:', execErr);
                    alert('Failed to copy text. Your browser does not support automatic copying. Please copy manually.');
                }
            }
            keyboardInput.focus(); // Keep focus on the textarea
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = ''; // Clear the textarea content
            keyboardInput.focus(); // Set focus back to the textarea
        });
    }

    // --- Focus and Blur handling for styling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    // --- Dark Mode Toggle (Integrated from your themeToggle.js logic) ---
    if (themeToggle && moonIcon && sunIcon) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Disable Dark Mode';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Enable Dark Mode';
        }

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i> Disable Dark Mode';
            } else {
                localStorage.setItem('theme', 'light');
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i> Enable Dark Mode';
            }
        });
    }
});

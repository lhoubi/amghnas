document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    // --- Theme Toggle Functionality (Keeping yours as is, it's good) ---
    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = savedTheme === 'dark';
    if (savedTheme === null) {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(isDarkMode);

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        applyTheme(isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // --- Tifinagh Character Mapping ---
    // This map needs to be ordered carefully for digraphs (multi-character inputs)
    // to be checked before single characters. Longer matches should be first.
    const tifinaghMap = {
        // Latin Digraphs (Order by length, longest first)
        'gh': 'ⵖ', 'kh': 'ⵅ', 'sh': 'ⵛ', 'ch': 'ⵛ', // ch might be different depending on dialect
        'dh': 'ⴹ', 'th': 'ⵜ', // Add if 'th' is a common input for Tifinagh
        'ts': 'ⵚ', // Add if 'ts' is a common input for Tifinagh

        // Latin Single Characters (case-sensitive where distinct Tifinagh exists)
        // Lowercase as primary, uppercase if it maps to a different Tifinagh character
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',

        // Explicit uppercase Latin if they map to DIFFERENT Tifinagh characters than their lowercase counterparts
        // (Based on your HTML data-latin attributes and what might be intended for 'shifted' keys)
        'A': 'ⵄ', // Your HTML: A -> ⵄ
        'ḍ': 'ⴹ', // Explicitly handle 'ḍ' (char 7693)
        'Ḥ': 'ⵃ', // Explicitly handle 'Ḥ' (char 7716)
        'L': 'ⵍ', // Your HTML: L -> ⵍ (same as l)
        'Ṛ': 'ⵕ', // Your HTML: Ṛ -> ⵕ
        'ṣ': 'ⵚ', // Explicitly handle 'ṣ' (char 7769)
        'ṭ': 'ⵟ', // Explicitly handle 'ṭ' (char 7793)
        'W̌': 'ⵯ', // Your HTML: ʷ -> ⵯ (char 785)
        'Ẓ': 'ⵥ', // Your HTML: ẓ -> ⵥ

        // Arabic Characters (ensure full coverage)
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
        'ة': 'ⴻ', 'ى': 'ⵉ', // Often mapped to 'i' or 'e'
        'ء': 'ⴻ', // Hamza
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        'ڤ': 'ⵠ', // Tifinagh V
        'ڭ': 'ⴳ', // Tifinagh G
        'ـ': 'ⵯ', // Tatweel/Kashida could map to W̌

        // Arabic Diacritics (handled more like combining marks, so setting to empty string to be ignored)
        'َ': '', // Fatha
        'ُ': '', // Damma
        'ِ': '', // Kasra
        'ْ': '', // Sukun
        'ّ': '', // Shadda
        'ٰ': '', // Alif Khanjariya
    };


    // Create a map for physical keyboard key codes to Tifinagh characters for animation/feedback
    // This is useful for `applyClickEffect` on the correct virtual key.
    const physicalKeyToTifinaghMap = new Map();
    keyboardKeys.forEach(button => {
        const tifinaghChar = button.dataset.key;
        if (tifinaghChar && tifinaghChar !== 'backspace' && tifinaghChar !== ' ') {
            // Find the corresponding Latin/Arabic labels
            const keyGroup = button.closest('.key-group');
            if (keyGroup) {
                const latinLabel = keyGroup.dataset.latin;
                const arabicLabel = keyGroup.dataset.arabic;

                if (latinLabel) {
                    // Handle single Latin char
                    if (latinLabel.length === 1) physicalKeyToTifinaghMap.set(latinLabel.toLowerCase(), tifinaghChar);
                    // Handle special Latin chars like 'ḍ'
                    physicalKeyToTifinaghMap.set(latinLabel, tifinaghChar); // Keep original case too
                }
                if (arabicLabel) {
                    // Handle single Arabic char
                    if (arabicLabel.length === 1) physicalKeyToTifinaghMap.set(arabicLabel, tifinaghChar);
                }
            }
        }
    });
    // Add space and backspace explicitly
    physicalKeyToTifinaghMap.set(' ', ' ');
    physicalKeyToTifinaghMap.set('Backspace', 'backspace');


    // --- Helper Function to Insert Text at Cursor ---
    // This function will now be the primary way all text changes are made
    function insertTextAtCursor(textArea, textToInsert, shiftCursor = 0) {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const before = textArea.value.substring(0, start);
        const after = textArea.value.substring(end);
        textArea.value = before + textToInsert + after;
        textArea.selectionStart = textArea.selectionEnd = start + textToInsert.length + shiftCursor;
        textArea.focus();
    }

    // --- Virtual Keyboard Input Handling ---
    keyboardKeys.forEach(keyButton => {
        keyButton.addEventListener('click', () => {
            const keyValue = keyButton.dataset.key; // This should be the Tifinagh char or 'backspace'

            if (keyValue === 'backspace') {
                const start = keyboardInput.selectionStart;
                const end = keyboardInput.selectionEnd;
                if (start > 0 || start !== end) { // Only if there's text or a selection
                    const before = keyboardInput.value.substring(0, start === end ? start - 1 : start);
                    const after = keyboardInput.value.substring(end);
                    keyboardInput.value = before + after;
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start === end ? start - 1 : start;
                }
            } else {
                insertTextAtCursor(keyboardInput, keyValue);
            }
            applyClickEffect(keyButton);
        });
    });

    // --- Physical Keyboard Input Conversion (The main logic) ---
    keyboardInput.addEventListener('keydown', (e) => {
        // Only process if the textarea is focused
        if (document.activeElement !== keyboardInput) return;

        const key = e.key;
        const start = keyboardInput.selectionStart;
        const end = keyboardInput.selectionEnd;
        const currentValue = keyboardInput.value;

        // --- Special Key Handling ---
        // Handle Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && key === 'a') {
            e.preventDefault();
            keyboardInput.select();
            return;
        }

        // Handle Backspace
        if (key === 'Backspace') {
            e.preventDefault();
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            // Use virtual keyboard's backspace logic
            if (start > 0 || start !== end) {
                const before = currentValue.substring(0, start === end ? start - 1 : start);
                const after = currentValue.substring(end);
                keyboardInput.value = before + after;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start === end ? start - 1 : start;
            }
            return;
        }

        // Handle physical Delete key (deletes char to the right or selection)
        if (key === 'Delete') {
            e.preventDefault();
            if (start < end) { // Selection exists
                insertTextAtCursor(keyboardInput, ''); // Delete selection
            } else if (start < currentValue.length) { // Delete char to the right
                const before = currentValue.substring(0, start);
                const after = currentValue.substring(start + 1);
                keyboardInput.value = before + after;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]'); // Visual feedback
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }

        // Handle Space bar
        if (key === ' ') {
            e.preventDefault();
            insertTextAtCursor(keyboardInput, ' ');
            const spaceKeyBtn = document.querySelector('.keyboard-key.wide[data-key=" "]');
            if (spaceKeyBtn) applyClickEffect(spaceKeyBtn);
            return;
        }

        // --- Character Conversion Logic ---
        // Only proceed if it's a single character key (not a modifier, arrow, etc.)
        if (key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault(); // IMPORTANT: Prevent the Latin/Arabic character from appearing initially

            const textBeforeCursor = currentValue.substring(0, start);
            const textAfterCursor = currentValue.substring(end);
            let charToInsert = key; // Default to the key itself if no conversion

            let matchedLength = 0; // How many Latin/Arabic chars were consumed by the conversion
            let tifinaghOutput = ''; // The Tifinagh character(s) after conversion

            // 1. Try to match 2-character Latin digraphs (e.g., 'sh', 'gh')
            if (textBeforeCursor.length >= 1) { // Need at least one char before
                const potentialDigraph = textBeforeCursor.slice(-1).toLowerCase() + key.toLowerCase(); // last char + current key
                if (tifinaghMap[potentialDigraph]) {
                    tifinaghOutput = tifinaghMap[potentialDigraph];
                    matchedLength = 2; // Two Latin chars consumed
                }
            }

            // 2. Try to match 3-character Latin digraphs (e.g., 'sch' - unlikely for Tifinagh but for completeness)
            // This would require checking if (textBeforeCursor.length >= 2) { ... }
            // For now, sticking to 2-char digraphs as most common.

            // 3. If no digraph, try single character conversion
            if (!tifinaghOutput) {
                // Prioritize exact case match first (e.g., for 'Ḍ' or Arabic chars)
                if (tifinaghMap[key]) {
                    tifinaghOutput = tifinaghMap[key];
                    matchedLength = 1;
                }
                // Then try lowercase Latin conversion
                else if (tifinaghMap[key.toLowerCase()]) {
                    tifinaghOutput = tifinaghMap[key.toLowerCase()];
                    matchedLength = 1;
                }
            }


            // --- Apply Conversion ---
            if (tifinaghOutput) {
                let newStart = start;
                let newEnd = end;
                let newTextBeforeCursor = textBeforeCursor;

                if (matchedLength === 2) { // It was a digraph
                    newTextBeforeCursor = textBeforeCursor.slice(0, -1); // Remove the last Latin char
                    newStart = start - 1; // Cursor moves back one
                }

                keyboardInput.value = newTextBeforeCursor + tifinaghOutput + textAfterCursor;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = newStart + tifinaghOutput.length;

                // Find the corresponding virtual key for animation
                const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghOutput}"]`);
                if (virtualKey) applyClickEffect(virtualKey);
            } else {
                // If no Tifinagh mapping, just insert the original key (e.g., punctuation, numbers)
                insertTextAtCursor(keyboardInput, key);
            }

            // Try to find a virtual key for visual feedback for the original key pressed
            const visualKeyMatch = physicalKeyToTifinaghMap.get(key) || physicalKeyToTifinaghMap.get(key.toLowerCase());
            if (visualKeyMatch && visualKeyMatch !== 'backspace' && visualKeyMatch !== ' ') {
                 const virtualKeyToAnimate = document.querySelector(`.keyboard-key[data-key="${visualKeyMatch}"]`);
                 if (virtualKeyToAnimate) applyClickEffect(virtualKeyToAnimate);
            }
        }
        // If it's not a single char (e.g., arrow keys, function keys), let default behavior happen
    });


    // --- Action Buttons (Copy/Clear) ---
    copyBtn.addEventListener('click', () => {
        keyboardInput.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(keyboardInput.value)
                .then(() => {
                    console.log('Tifinagh text copied to clipboard!');
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    fallbackCopyTextToClipboard(keyboardInput.value);
                });
        } else {
            fallbackCopyTextToClipboard(keyboardInput.value);
        }
        window.getSelection().removeAllRanges(); // Deselect text
        keyboardInput.focus();
    });

    clearBtn.addEventListener('click', () => {
        keyboardInput.value = '';
        keyboardInput.focus();
    });

    // Fallback for copying text (older browsers)
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('Fallback: Tifinagh text copied to clipboard!');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 1500);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }

    // --- Click Effect Function (Red Fire) ---
    function applyClickEffect(element) {
        element.classList.add('key-active');
        setTimeout(() => {
            element.classList.remove('key-active');
        }, 150);
    }

    // Update copyright year dynamically
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
});

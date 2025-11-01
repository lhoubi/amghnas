document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Starting script initialization.');

    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    // --- Critical Checks for Element Existence ---
    if (!keyboardInput) {
        console.error('ERROR: Element with ID "keyboardInput" not found! Virtual keyboard and physical input will not work.');
        return; // Stop script execution if the main input field is missing
    }
    if (keyboardKeys.length === 0) {
        console.warn('WARNING: No elements with class "keyboard-key" found. Virtual keyboard buttons may not function.');
    }
    if (!copyBtn) console.warn('WARNING: Copy button not found.');
    if (!clearBtn) console.warn('WARNING: Clear button not found.');
    if (!themeToggle) console.warn('WARNING: Theme toggle button not found.');

    console.log('All required DOM elements checked.');

    // --- Theme Toggle Functionality ---
    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = savedTheme === 'dark';

    if (savedTheme === null) {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(isDarkMode);

    if (themeToggle) { // Only add listener if button exists
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            applyTheme(isDarkMode);
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            console.log('Theme toggled to dark mode:', isDarkMode);
        });
    }

    // --- Virtual Keyboard Input ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key;
            console.log('Virtual key clicked:', keyValue);
            handleInput(keyValue);
            applyClickEffect(key);
        });
    });

    function handleInput(keyValue) {
        let start = keyboardInput.selectionStart;
        let end = keyboardInput.selectionEnd;
        let currentValue = keyboardInput.value;

        if (keyValue === 'backspace') {
            if (start > 0) {
                let newValue = currentValue.substring(0, start - 1) + currentValue.substring(end);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
            }
        } else if (keyValue === ' ') {
            let newValue = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + 1;
        } else {
            let newValue = currentValue.substring(0, start) + keyValue + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + keyValue.length;
        }
        keyboardInput.focus();
        console.log('handleInput called. Current value:', keyboardInput.value);
    }

    // --- Physical Keyboard Mapping ---
    const keyMap = {
        // Latin to Tifinagh
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',

        // Latin to Tifinagh (uppercase)
        'A': 'ⵄ', 'D': 'ⴹ', 'G': 'ⵖ', 'H': 'ⵃ', 'R': 'ⵕ', 'S': 'ⵚ', 'T': 'ⵟ', 'W': 'ⵯ', 'Z': 'ⵥ',

        // Arabic to Tifinagh (from your provided list - includes 'ة' and 'لا' for VIRTUAL keyboard if needed)
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', 'إ': 'ⵉ', 'أُ': 'ⵓ',
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ',
        'ط': 'ⵟ', 'ظ': 'ⴹ',
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ',
        'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', // Re-added for virtual keyboard. Physical key will be blocked below.
        'ى': 'ⵉ',
        'ء': 'ⴻ',
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        'ڤ': 'ⵠ',
        'ڭ': 'ⴳ',
        'ـ': 'ⵯ',
        'لا': 'ⵍⴰ', // Re-added for virtual keyboard. Physical key will be blocked below.

        // Digraphs
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴹ', 'ts': 'ⵚ', 'gl': 'ⴳⵍ',
        ' ': ' ',
        'Backspace': 'backspace',
    };

    document.addEventListener('keydown', (e) => {
        // --- Debugging focus state ---
        if (document.activeElement !== keyboardInput) {
            console.log('KEYDOWN: Input not focused. Active element:', document.activeElement);
            return; // Exit if input is not focused
        }
        console.log('KEYDOWN: Key pressed:', e.key, 'Code:', e.code);

        const key = e.key;
        const currentValue = keyboardInput.value;

        // --- 1. HANDLE SPECIAL/CONTROL KEYS FIRST (always prevent default) ---

        // Handle Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && key === 'a') {
            console.log('KEYDOWN: Ctrl/Cmd + A detected.');
            e.preventDefault();
            keyboardInput.select();
            return;
        }

        // Handle Backspace
        if (key === 'Backspace') {
            console.log('KEYDOWN: Backspace detected.');
            e.preventDefault();
            handleInput('backspace');
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }

        // Handle Delete key
        if (key === 'Delete') {
            console.log('KEYDOWN: Delete detected.');
            e.preventDefault();
            let start = keyboardInput.selectionStart;
            let end = keyboardInput.selectionEnd;
            if (start !== end) {
                let newValue = currentValue.substring(0, start) + currentValue.substring(end);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            } else if (end < currentValue.length) {
                let newValue = currentValue.substring(0, start) + currentValue.substring(end + 1);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }

        // Handle space directly for physical keyboard
        if (key === ' ') {
            console.log('KEYDOWN: Space detected.');
            e.preventDefault();
            handleInput(' ');
            const spaceKeyBtn = document.querySelector('.keyboard-key.wide[data-key=" "]');
            if (spaceKeyBtn) applyClickEffect(spaceKeyBtn);
            return;
        }

        // --- 2. EXPLICITLY BLOCK PHYSICAL ARABIC 'ة' AND 'لا' INPUT ---
        // These keys should produce NO output.
        if (key === 'ة') {
            console.log('KEYDOWN: Arabic "ة" detected. Blocking input.');
            e.preventDefault();
            return;
        }

        // For 'لا' (ل then ا), we need to block the 'ا' if it follows a 'ل'
        if (key === 'ا' && currentValue.endsWith('ل')) {
            console.log('KEYDOWN: Arabic "لا" sequence detected (ل + ا). Blocking input.');
            e.preventDefault();
            return;
        }

        // --- 3. HANDLE OTHER MAPPINGS (ONLY IF NOT BLOCKED ABOVE) ---

        let tifinaghChar;

        // Check for 'ل' + 'ا' sequence that should map to 'ⵍⴰ' if not already blocked (e.g., Latin 'l'+'a')
        // NOTE: The Arabic 'ل'+'ا' is already explicitly blocked above, so this section would only apply
        // if another form of 'ل'+'ا' was intended to map to 'ⵍⴰ' (e.g., if you have Latin 'l' then 'a' mapping).
        // Given your keyMap, it expects 'لا' as a single key entry.
        // It's safer to just check `keyMap[key]` first for direct matches like 'ا' to 'ⴰ'.
        // This specific ligature handling for 'ل' + 'ا' should now only run if `keyMap['لا']` is being looked up directly,
        // or if `e.key` for 'ا' and previous was 'ل' *wasn't* the Arabic 'لا' that got blocked.
        // For simplicity and to avoid confusion, for your specific `keyMap` (where 'لا' is a single entry),
        // we'll primarily rely on `keyMap[key]` and `keyMap[key.toLowerCase()]`.
        // The more robust handling for multi-character inputs might require a state machine.
        // For now, let's keep it simple: if `e.key` matches 'لا' directly (unlikely for physical key), or 'ا' if it forms it,
        // it would have been blocked above. Other 'ل' then 'ا' (e.g. Latin) would fall into the general mapping.


        // 1. Try to find a direct exact match for the key in keyMap (e.g., 'a' for 'ⴰ', 'ا' for 'ⴰ')
        if (keyMap[key]) {
            tifinaghChar = keyMap[key];
            console.log('KEYDOWN: Found direct keyMap match:', key, '->', tifinaghChar);
        }
        // 2. If no exact match, try the lowercase version (e.g., 'A' for 'ⵄ' via 'a' for 'ⴰ')
        else if (keyMap[key.toLowerCase()]) {
            tifinaghChar = keyMap[key.toLowerCase()];
            console.log('KEYDOWN: Found lowercase keyMap match:', key.toLowerCase(), '->', tifinaghChar);
        }

        if (tifinaghChar) {
            e.preventDefault(); // ONLY prevent default if we successfully found a Tifinagh character to input
            handleInput(tifinaghChar);
            const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
            if (virtualKey) applyClickEffect(virtualKey);
            console.log('KEYDOWN: Tifinagh character inserted:', tifinaghChar);
            return;
        }

        // --- 4. FALLBACK: If no mapping or special key, allow browser default ---
        console.log('KEYDOWN: No specific Tifinagh mapping or special key. Allowing browser default for:', key);
        // Do nothing here, allow the browser to insert its default character.
    });


    // --- Action Buttons (Copy/Clear) ---
    if (copyBtn) {
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
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
            console.log('Cleared input field.');
        });
    }

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
        } finally { // Ensure textarea is removed even if copy fails
            document.body.removeChild(textArea);
        }
    }

    // --- Click Effect Function (Red Fire) ---
    function applyClickEffect(element) {
        if (element) {
            element.classList.add('key-active');
            setTimeout(() => {
                element.classList.remove('key-active');
            }, 150);
        }
    }

    const copyrightYearElement = document.getElementById('copyright-year');
    if (copyrightYearElement) {
        copyrightYearElement.textContent = new Date().getFullYear();
    } else {
        console.warn('WARNING: Element with ID "copyright-year" not found.');
    }

    console.log('Script initialization complete.');
});

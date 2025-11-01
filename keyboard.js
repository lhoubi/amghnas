document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    // --- Theme Toggle Functionality ---
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

    // --- Virtual Keyboard Input ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key;
            // IMPORTANT: Virtual keyboard clicks should always work,
            // so we call handleInput directly.
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
        'ة': 'ⴻ', // RE-ADDED for potential virtual keyboard use or other Arabic-to-Tifinagh mappings
        'ى': 'ⵉ',
        'ء': 'ⴻ',
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        'ڤ': 'ⵠ',
        'ڭ': 'ⴳ',
        'ـ': 'ⵯ',
        'لا': 'ⵍⴰ', // RE-ADDED for potential virtual keyboard use or other Arabic-to-Tifinagh mappings

        // Digraphs
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴹ', 'ts': 'ⵚ', 'gl': 'ⴳⵍ',
        ' ': ' ',
        'Backspace': 'backspace',
    };

    document.addEventListener('keydown', (e) => {
        // Only process if the textarea is focused
        if (document.activeElement === keyboardInput) {
            const key = e.key;
            const currentValue = keyboardInput.value; // Get current value here for checks

            // --- 1. HANDLE SPECIAL/CONTROL KEYS FIRST (always prevent default) ---

            // Handle Ctrl/Cmd + A (Select All)
            if ((e.ctrlKey || e.metaKey) && key === 'a') {
                e.preventDefault();
                keyboardInput.select();
                return;
            }

            // Handle Backspace
            if (key === 'Backspace') {
                e.preventDefault();
                handleInput('backspace');
                const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
                if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
                return;
            }

            // Handle Delete key
            if (key === 'Delete') {
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
                e.preventDefault();
                handleInput(' ');
                const spaceKeyBtn = document.querySelector('.keyboard-key.wide[data-key=" "]');
                if (spaceKeyBtn) applyClickEffect(spaceKeyBtn);
                return;
            }

            // --- 2. EXPLICITLY BLOCK PHYSICAL ARABIC 'ة' AND 'لا' INPUT ---
            // If the user presses the physical Arabic 'ة' key.
            if (key === 'ة') {
                e.preventDefault(); // Stop the browser from handling it
                return;             // Stop all further processing for this key press
            }

            // If the user types 'ل' followed by 'ا' which forms Arabic 'لا'
            // We need to check the current input state to identify this sequence for blocking.
            if (key === 'ا' && currentValue.endsWith('ل')) {
                e.preventDefault(); // Stop the browser from handling it
                return;             // Stop all further processing for this key press
            }

            // --- 3. HANDLE OTHER MAPPINGS (ONLY IF NOT BLOCKED ABOVE) ---

            let tifinaghChar;

            // Prioritize the 'ل' + 'ا' sequence to form 'ⵍⴰ' if it's NOT the Arabic 'لا' that we just blocked.
            // This is primarily for other mapping scenarios (e.g., Latin 'l' + 'a').
            if (key === 'ا' && currentValue.endsWith('ل')) { // This condition will only be met if the Arabic 'لا' was NOT typed
                const potentialLigature = currentValue.slice(-1) + key; // 'ل' + 'ا'
                if (keyMap[potentialLigature]) {
                    e.preventDefault();
                    keyboardInput.value = currentValue.slice(0, -1); // Remove the 'ل'
                    handleInput(keyMap[potentialLigature]); // Add 'ⵍⴰ'
                    const virtualKey = document.querySelector(`.keyboard-key[data-key="${keyMap[potentialLigature]}"]`);
                    if (virtualKey) applyClickEffect(virtualKey);
                    return;
                }
            }


            // Try to find a direct match for the key (e.g., 'a' for 'ⴰ', 'ا' for 'ⴰ')
            if (keyMap[key]) {
                tifinaghChar = keyMap[key];
            }
            // If no exact match, try the lowercase version (e.g., 'A' for 'ⵄ' via 'a' for 'ⴰ')
            else if (keyMap[key.toLowerCase()]) {
                tifinaghChar = keyMap[key.toLowerCase()];
            }

            if (tifinaghChar) {
                e.preventDefault(); // ONLY prevent default if we successfully found a Tifinagh character to input
                handleInput(tifinaghChar);
                const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
                if (virtualKey) applyClickEffect(virtualKey);
                return; // Stop further processing after a successful Tifinagh input
            }

            // --- 4. FALLBACK: IF NO MAPPING OR SPECIAL KEY, ALLOW BROWSER DEFAULT ---
            // If we reach here, it means:
            // - It wasn't a special key (Backspace, Delete, Space, Ctrl+A)
            // - It wasn't the physical Arabic 'ة' or 'لا' sequence that we specifically blocked
            // - It wasn't a key that successfully mapped to a Tifinagh character.
            // In this case, we DO NOT call e.preventDefault(), allowing the browser to insert
            // the default character for that key (e.g., typing 'z' if 'z' isn't in keyMap).
        }
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

    document.getElementById('copyright-year').textContent = new Date().getFullYear();
});

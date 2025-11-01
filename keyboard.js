document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    // --- Theme Toggle Functionality ---
    // Function to apply theme
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

    // Load theme preference from localStorage on page load
    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = savedTheme === 'dark'; // Initialize based on saved preference

    // If no theme is saved, check system preference
    if (savedTheme === null) {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(isDarkMode); // Apply the theme immediately

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode; // Toggle the state
        applyTheme(isDarkMode); // Apply the new state
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // Save preference
    });

    // --- Virtual Keyboard Input ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key;
            handleInput(keyValue);
            applyClickEffect(key); // Apply the visual click effect
            keyboardInput.focus(); // Ensure focus remains on textarea after virtual key click
        });
    });

    function handleInput(keyValue) {
        let start = keyboardInput.selectionStart;
        let end = keyboardInput.selectionEnd;
        let currentValue = keyboardInput.value;

        if (keyValue === 'backspace') {
            if (start > 0 || start !== end) { // Only delete if there's a selection or cursor is not at start
                let newValue = currentValue.substring(0, start - (start === end ? 1 : 0)) + currentValue.substring(end);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start - (start === end ? 1 : 0);
            }
        } else { // Handles regular keys and ' ' (space)
            let newValue = currentValue.substring(0, start) + keyValue + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + keyValue.length;
        }
        // No need for keyboardInput.focus() here, as it's added after `applyClickEffect` in the `forEach` loop.
    }

    // --- Physical Keyboard Mapping (No Changes Here, per your request) ---
    const keyMap = {
        // Latin to Tifinagh (lowercase for default lookup)
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',

        // Latin to Tifinagh (uppercase for *distinct* Tifinagh characters)
        'A': 'ⵄ', 'D': 'ⴹ', 'G': 'ⵖ', 'H': 'ⵃ', 'R': 'ⵕ', 'S': 'ⵚ', 'T': 'ⵟ', 'W': 'ⵯ', 'Z': 'ⵥ',

        // Arabic to Tifinagh (from your provided list)
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
        'ڤ': 'ⵠ',
        'ڭ': 'ⴳ',
        'ـ': 'ⵯ', // Special character from arabicToTifinaghMap

        // Digraphs (e.g., 'gh' -> 'ⵖ').
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴹ', 'ts': 'ⵚ', 'gl': 'ⴳⵍ',
        ' ': ' ',
        'Backspace': 'backspace',
    };

    document.addEventListener('keydown', (e) => {
        // Only process if the textarea is focused
        if (document.activeElement === keyboardInput) {
            const key = e.key;
            let start = keyboardInput.selectionStart;
            let end = keyboardInput.selectionEnd;
            let currentValue = keyboardInput.value;

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

            // Handle physical Delete key for selection and character to the right
            if (key === 'Delete') {
                e.preventDefault();
                if (start < end) { // If text is selected, delete the selection
                    let newValue = currentValue.substring(0, start) + currentValue.substring(end);
                    keyboardInput.value = newValue;
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
                } else if (end < currentValue.length) { // If no text selected, delete character to the right
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

            // --- Digraph Handling ---
            let handledAsDigraph = false;
            if (key.length === 1 && /[a-zA-Z]/.test(key)) {
                const textBeforeCursor = currentValue.substring(0, start);
                let longestDigraphMatch = null;
                let matchedDigraphKey = null;

                for (const digraph in keyMap) {
                    if (digraph.length > 1 && textBeforeCursor.length >= digraph.length - 1) {
                        const potentialInput = textBeforeCursor.slice(-(digraph.length - 1)) + key.toLowerCase();
                        if (potentialInput === digraph) {
                            if (!longestDigraphMatch || digraph.length > longestDigraphMatch.length) {
                                longestDigraphMatch = keyMap[digraph];
                                matchedDigraphKey = digraph;
                            }
                        }
                    }
                }

                if (longestDigraphMatch && matchedDigraphKey) {
                    e.preventDefault();
                    let newValue = currentValue.substring(0, start - (matchedDigraphKey.length - 1)) + longestDigraphMatch + currentValue.substring(end);
                    keyboardInput.value = newValue;
                    keyboardInput.selectionStart = keyboardInput.selectionEnd = start - (matchedDigraphKey.length - 1) + longestDigraphMatch.length;
                    keyboardInput.focus();
                    const virtualKey = document.querySelector(`.keyboard-key[data-key="${longestDigraphMatch}"]`);
                    if (virtualKey) applyClickEffect(virtualKey);
                    handledAsDigraph = true;
                    return;
                }
            }
            // --- End Digraph Handling ---

            // Try to find a direct mapping for other keys (Latin, Arabic, etc.)
            let tifinaghChar = keyMap[key.toLowerCase()];
            if (!tifinaghChar && key.length === 1 && /[A-Z]/.test(key)) {
                tifinaghChar = keyMap[key];
            }
            if (!tifinaghChar && keyMap[key]) {
                 tifinaghChar = keyMap[key];
            }

            if (tifinaghChar && !handledAsDigraph) {
                e.preventDefault();
                handleInput(tifinaghChar);
                const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
                if (virtualKey) applyClickEffect(virtualKey);
                return;
            }
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

    document.getElementById('copyright-year').textContent = new Date().getFullYear();
});

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
        } else if (keyValue === 'Delete') { // Handle 'Delete' for physical key logic if not 'backspace'
            if (start !== end) { // If text is selected
                let newValue = currentValue.substring(0, start) + currentValue.substring(end);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            } else if (end < currentValue.length) { // If cursor is in middle, delete next char
                let newValue = currentValue.substring(0, start) + currentValue.substring(end + 1);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
        }
        else { // General character insertion
            let newValue = currentValue.substring(0, start) + keyValue + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + keyValue.length;
        }
        keyboardInput.focus();
        console.log('handleInput called. Current value:', keyboardInput.value);
    }

    // --- Physical Keyboard Mapping ---
    const keyMap = {
        // Latin to Tifinagh (case-sensitive)
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        // Latin to Tifinagh (uppercase)
        'A': 'ⵄ', 'D': 'ⴹ', 'G': 'ⵖ', 'H': 'ⵃ', 'R': 'ⵕ', 'S': 'ⵚ', 'T': 'ⵟ', 'W': 'ⵯ', 'Z': 'ⵥ',

        // Arabic to Tifinagh (primarily for virtual keys if they exist, or specific physical mappings)
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
        'ة': 'ⴻ',
        'ى': 'ⵉ',
        'ء': 'ⴻ',
        'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        'ڤ': 'ⵠ',
        'ڭ': 'ⴳ',
        'ـ': 'ⵯ',
        'لا': 'ⵍⴰ', // Note: Physical 'لا' is complex; this is mostly for virtual.

        // Digraphs (primarily for virtual keyboard buttons with data-key="gh" etc.)
        // Physical typing of 'gh' requires more complex state management
        // For now, these will only work if a virtual key sends "gh" as a single value.
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴹ', 'ts': 'ⵚ', 'gl': 'ⴳⵍ',

        ' ': ' ', // Space
    };

    document.addEventListener('keydown', (e) => {
        // Only process keydown events when the keyboardInput is the active element
        if (document.activeElement !== keyboardInput) {
            console.log('KEYDOWN: Input not focused. Active element:', document.activeElement.tagName, document.activeElement.id);
            return;
        }
        console.log('KEYDOWN: Key pressed:', e.key, 'Code:', e.code, 'Shift:', e.shiftKey);

        const key = e.key;

        // --- 1. HANDLE SPECIAL/CONTROL KEYS ---

        // Handle Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && key === 'a') {
            console.log('KEYDOWN: Ctrl/Cmd + A detected.');
            // Allow default for selection
            return;
        }

        // Handle Backspace
        if (key === 'Backspace') {
            console.log('KEYDOWN: Backspace detected.');
            e.preventDefault(); // Prevent browser's default backspace behavior
            handleInput('backspace');
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }

        // Handle Delete key
        if (key === 'Delete') {
            console.log('KEYDOWN: Delete detected.');
            e.preventDefault(); // Prevent browser's default delete behavior
            handleInput('Delete'); // Pass 'Delete' to handleInput to manage deletion logic
            // Assuming you have a virtual key for delete, click effect it
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]'); // Or specific delete key
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

        // --- 2. ATTEMPT TO MAP TO TIFINAGH ---
        let tifinaghChar = keyMap[key];

        if (tifinaghChar) {
            e.preventDefault(); // ONLY prevent default if we successfully found a Tifinagh character to input
            handleInput(tifinaghChar);
            const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
            if (virtualKey) applyClickEffect(virtualKey);
            console.log('KEYDOWN: Tifinagh character inserted:', tifinaghChar);
            return;
        }

        // --- 3. FALLBACK: If no mapping, prevent default to avoid unwanted characters ---
        // This is crucial: if a key is pressed that isn't a special key (like Backspace/Space)
        // and doesn't map to a Tifinagh character, we prevent its default action
        // to ensure only Tifinagh or intended characters appear.
        if (!e.ctrlKey && !e.metaKey && !e.altKey) { // Don't block modifier combinations
            console.log('KEYDOWN: No Tifinagh mapping found for:', key, '. Preventing default.');
            e.preventDefault();
        } else {
            console.log('KEYDOWN: Modifier key pressed with:', key, '. Allowing default (e.g., Ctrl+C).');
        }
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
                        console.error('Failed to copy text using navigator.clipboard: ', err);
                        fallbackCopyTextToClipboard(keyboardInput.value);
                    });
            } else {
                console.warn('navigator.clipboard not available. Using fallback.');
                fallbackCopyTextToClipboard(keyboardInput.value);
            }
            keyboardInput.focus(); // Keep focus on the input field after copy
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

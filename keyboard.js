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

    // --- Virtual Keyboard Input (Rest of your existing code) ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key;
            handleInput(keyValue);
            applyClickEffect(key); // Apply the visual click effect
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
        } else if (keyValue === ' ') { // Handle space explicitly
            let newValue = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + 1;
        } else {
            let newValue = currentValue.substring(0, start) + keyValue + currentValue.substring(end);
            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + keyValue.length;
        }
        keyboardInput.focus(); // Keep focus on the textarea
    }

    // --- Physical Keyboard Mapping ---
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
        'لا': 'ⵍⴰ', // ADDED: Arabic 'لا' to Tifinagh 'ⵍⴰ'

        // Digraphs (e.g., 'gh' -> 'ⵖ').
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ', 'dh': 'ⴹ', 'ts': 'ⵚ', 'gl': 'ⴳⵍ',
        ' ': ' ',
        'Backspace': 'backspace',
    };

   document.addEventListener('keydown', (e) => {
    // Only process if the textarea is focused
    if (document.activeElement === keyboardInput) {
        const key = e.key;

        // Handle Ctrl/Cmd + A (Select All)
        if ((e.ctrlKey || e.metaKey) && key === 'a') {
            e.preventDefault(); // Prevent browser's default select all
            keyboardInput.select();
            return; // Stop further processing after handling Select All
        }

        // Handle Backspace
        if (key === 'Backspace') {
            e.preventDefault(); // Prevent default browser back action
            handleInput('backspace');
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }

        // --- MODIFIED LOGIC for Delete key ---
        if (key === 'Delete') {
            e.preventDefault(); // Prevent default browser delete action
            let start = keyboardInput.selectionStart;
            let end = keyboardInput.selectionEnd;
            let currentValue = keyboardInput.value;

            // If text is selected (start != end), delete the selection
            if (start !== end) {
                let newValue = currentValue.substring(0, start) + currentValue.substring(end);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            } else if (end < currentValue.length) { // If no text selected, delete character to the right
                let newValue = currentValue.substring(0, start) + currentValue.substring(end + 1);
                keyboardInput.value = newValue;
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
            const deleteKeyBtn = document.querySelector('.keyboard-key.delete[data-key="backspace"]'); // Still activate virtual backspace button for visual feedback
            if (deleteKeyBtn) applyClickEffect(deleteKeyBtn);
            return;
        }
        // --- END MODIFIED LOGIC ---

        // Handle space directly for physical keyboard
        if (key === ' ') {
            e.preventDefault(); // Prevent default space behavior (e.g., scrolling)
            handleInput(' ');
            const spaceKeyBtn = document.querySelector('.keyboard-key.wide[data-key=" "]');
            if (spaceKeyBtn) applyClickEffect(spaceKeyBtn);
            return;
        }

        // --- MODIFIED LOGIC FOR KEY MAPPING ---
        let tifinaghChar;

        // Prioritize multi-character Arabic mappings if the input field ends with a relevant character
        // This is a simplified approach for 'لا'. For more complex digraphs/ligatures,
        // a more robust state machine or input buffer might be needed.
        if (key === 'ا' && keyboardInput.value.endsWith('ل')) {
            const potentialLigature = keyboardInput.value.slice(-1) + key; // 'ل' + 'ا'
            if (keyMap[potentialLigature]) {
                e.preventDefault();
                keyboardInput.value = keyboardInput.value.slice(0, -1); // Remove the 'ل'
                handleInput(keyMap[potentialLigature]); // Add 'ⵍⴰ'
                const virtualKey = document.querySelector(`.keyboard-key[data-key="${keyMap[potentialLigature]}"]`);
                if (virtualKey) applyClickEffect(virtualKey);
                return;
            }
        }


        // 1. Try to find an exact match for the key (e.g., 'A' for 'ⵄ')
        if (keyMap[key]) {
            tifinaghChar = keyMap[key];
        }
        // 2. If no exact match, try the lowercase version (e.g., 'b' for 'ⴱ')
        else if (keyMap[key.toLowerCase()]) {
            tifinaghChar = keyMap[key.toLowerCase()];
        }

        if (tifinaghChar) {
            e.preventDefault(); // Prevent default Latin character from appearing
            handleInput(tifinaghChar);
            // Find the corresponding virtual key and apply effect
            const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
            if (virtualKey) applyClickEffect(virtualKey);
            return;
        }
        // --- END MODIFIED LOGIC ---
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
</script>

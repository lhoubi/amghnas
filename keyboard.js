document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Starting script initialization.');

    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    if (!keyboardInput) {
        console.error('ERROR: Element with ID "keyboardInput" not found!');
        return;
    }
    if (keyboardKeys.length === 0) console.warn('WARNING: No keyboard-key elements found.');
    if (!copyBtn) console.warn('WARNING: Copy button not found.');
    if (!clearBtn) console.warn('WARNING: Clear button not found.');
    if (!themeToggle) console.warn('WARNING: Theme toggle button not found.');

    // --- Theme Toggle ---
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
    if (savedTheme === null) isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(isDarkMode);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            applyTheme(isDarkMode);
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }

    // --- Virtual Keyboard Input ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.dataset.key;
            handleInput(keyValue);
            applyClickEffect(key);
        });
    });

    function handleInput(keyValue) {
        let start = keyboardInput.selectionStart;
        let end = keyboardInput.selectionEnd;
        let currentValue = keyboardInput.value;

        if (keyValue === 'backspace') {
            if (start !== end) {
                keyboardInput.value = currentValue.substring(0, start) + currentValue.substring(end);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            } else if (start > 0) {
                keyboardInput.value = currentValue.substring(0, start - 1) + currentValue.substring(start);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
            }
        } else if (keyValue === 'Delete') {
            if (start !== end) {
                keyboardInput.value = currentValue.substring(0, start) + currentValue.substring(end);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            } else if (end < currentValue.length) {
                keyboardInput.value = currentValue.substring(0, start) + currentValue.substring(end + 1);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
            }
        } else {
            keyboardInput.value = currentValue.substring(0, start) + keyValue + currentValue.substring(end);
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start + keyValue.length;
        }
        keyboardInput.focus();
    }

    // --- Key Map ---
    const keyMap = {
        // Lowercase Latin
        'a':'ⴰ','b':'ⴱ','c':'ⵛ','d':'ⴷ','e':'ⴻ','f':'ⴼ',
        'g':'ⴳ','h':'ⵀ','i':'ⵉ','j':'ⵊ','k':'ⴽ','l':'ⵍ',
        'm':'ⵎ','n':'ⵏ','o':'ⵓ','p':'ⵒ','q':'ⵇ','r':'ⵔ',
        's':'ⵙ','t':'ⵜ','u':'ⵓ','v':'ⵠ','w':'ⵡ',
        'x':'ⵅ','y':'ⵢ','z':'ⵣ',
        // Special emphatic UPPERCASE (SHIFT key) — distinct Tifinagh chars
        'A':'ⵄ','D':'ⴹ','G':'ⵖ','H':'ⵃ','R':'ⵕ','S':'ⵚ','T':'ⵟ','W':'ⵯ','Z':'ⵥ',
        // Arabic
        'ا':'ⴰ','أ':'ⴰ','آ':'ⴰ','إ':'ⵉ','أُ':'ⵓ',
        'ب':'ⴱ','ت':'ⵜ','ث':'ⵜ',
        'ج':'ⵊ','ح':'ⵃ','خ':'ⵅ',
        'د':'ⴷ','ذ':'ⴷ',
        'ر':'ⵔ','ز':'ⵣ',
        'س':'ⵙ','ش':'ⵛ','ص':'ⵚ','ض':'ⴹ',
        'ط':'ⵟ','ظ':'ⴹ',
        'ع':'ⵄ','غ':'ⵖ',
        'ف':'ⴼ','ق':'ⵇ','ك':'ⴽ',
        'ل':'ⵍ','م':'ⵎ','ن':'ⵏ',
        'ه':'ⵀ','و':'ⵡ','ي':'ⵢ',
        'ى':'ⵉ','ؤ':'ⵓ','ئ':'ⵉ',
        'ڤ':'ⵠ','ڭ':'ⴳ','ـ':'ⵯ',
        'لا':'ⵍⴰ',
        // ة → produces NOTHING (intentionally omitted)
        // Digraphs
        'gh':'ⵖ','kh':'ⵅ','ch':'ⵛ','sh':'ⵛ','dh':'ⴹ','ts':'ⵚ','gl':'ⴳⵍ',
        ' ':' ',
    };

    // --- Physical Keyboard ---
    document.addEventListener('keydown', (e) => {
        if (document.activeElement !== keyboardInput) return;

        const key = e.key;

        // Allow browser shortcuts
        if ((e.ctrlKey || e.metaKey) && key === 'a') return;
        if (e.ctrlKey || e.metaKey) return;

        // Backspace
        if (key === 'Backspace') {
            e.preventDefault();
            handleInput('backspace');
            const btn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (btn) applyClickEffect(btn);
            return;
        }

        // Delete
        if (key === 'Delete') {
            e.preventDefault();
            handleInput('Delete');
            return;
        }

        // Space
        if (key === ' ') {
            e.preventDefault();
            handleInput(' ');
            const spaceBtn = document.querySelector('.keyboard-key.wide[data-key=" "]');
            if (spaceBtn) applyClickEffect(spaceBtn);
            return;
        }

        // ة → block completely, produce nothing
        if (key === 'ة') {
            e.preventDefault();
            return;
        }

        // Try exact key match first (handles special emphatics A D G H R S T W Z)
        let tifinaghChar = keyMap[key];

        // If no exact match AND key is a non-special uppercase letter,
        // fall back to its lowercase Tifinagh equivalent
        if (!tifinaghChar && key.length === 1 && key >= 'A' && key <= 'Z') {
            tifinaghChar = keyMap[key.toLowerCase()];
        }

        if (tifinaghChar) {
            e.preventDefault();
            handleInput(tifinaghChar);
            const virtualKey = document.querySelector(`.keyboard-key[data-key="${tifinaghChar}"]`);
            if (virtualKey) applyClickEffect(virtualKey);
            return;
        }

        // Block everything else (unmapped keys, ة from Arabic keyboard, etc.)
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
        }
    });

    // --- Mobile: block ة via input + beforeinput events ---
    keyboardInput.addEventListener('beforeinput', function(e) {
        if (e.data && e.data.includes('ة')) {
            e.preventDefault();
        }
    });

    keyboardInput.addEventListener('input', function() {
        if (this.value.includes('ة')) {
            const pos = this.selectionStart;
            this.value = this.value.replace(/ة/g, '');
            this.selectionStart = this.selectionEnd = Math.max(0, pos - 1);
        }
    });

    // --- Copy Button ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keyboardInput.value)
                    .then(() => {
                        const orig = copyBtn.innerHTML;
                        copyBtn.innerHTML = '✓ Copied!';
                        setTimeout(() => { copyBtn.innerHTML = orig; }, 1500);
                    })
                    .catch(() => fallbackCopy(keyboardInput.value));
            } else {
                fallbackCopy(keyboardInput.value);
            }
            keyboardInput.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
        });
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Copied!';
            setTimeout(() => { copyBtn.innerHTML = orig; }, 1500);
        } catch(err) {}
        document.body.removeChild(ta);
    }

    // --- Click Effect ---
    function applyClickEffect(element) {
        if (element) {
            element.classList.add('key-active');
            setTimeout(() => element.classList.remove('key-active'), 150);
        }
    }

    // --- Copyright Year ---
    const yr = document.getElementById('copyright-year');
    if (yr) yr.textContent = new Date().getFullYear();

    console.log('Script initialization complete.');
});

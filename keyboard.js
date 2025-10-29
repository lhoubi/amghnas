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
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ' // Space key
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for distinct shifted outputs) ---
    // Corrected to use the specific Tifinagh chars from your HTML for caps
    const tifinaghShiftMap = {
        'A': 'ⵄ', // as per HTML
        'G': 'ⵖ', // added 'gh' Tifinagh equivalent
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
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
    };

    // --- Arabic to Tifinagh Mapping ---
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
        'ـ': 'ⵯ', // Arabic Tatweel for ʷ (Corrected: 'ـ' maps to 'ⵯ')
        'ڤ': 'ⵠ', // Added for 'v'
        'ڭ': 'ⴳ', // Added for 'g'
        // 'ك_for_C': 'ⵛ' // Removed: special handling not needed this way
    };

    /**
     * Activates the 'fire-active' animation on a given key element.
     * @param {HTMLElement} keyElement The virtual keyboard button to animate.
     */
    function activateKeyAnimation(keyElement) {
        if (keyElement) {
            keyElement.classList.remove('fire-active');
            void keyElement.offsetWidth; // Force reflow for animation restart
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
        // --- FIX 1: Ensure 'backspace' and 'space' can be found ---
        if (searchKey === 'backspace') {
            return document.querySelector(`.keyboard-key[data-key="backspace"]`);
        }
        // Corrected 'enter' data-key based on common practice (if you add an enter key)
        if (searchKey === 'enter') {
             // Assuming you might add an 'enter' key later with data-key="enter"
            return document.querySelector(`.keyboard-key[data-key="enter"]`);
        }
        if (searchKey === ' ' && type === 'tifinagh') { // Explicitly for the spacebar button
             return document.querySelector(`.keyboard-key[data-key=" "]`);
        }

        let keyElement = document.querySelector(`.keyboard-key[data-key="${searchKey}"]`);
        if (keyElement) return keyElement;

        // Search by label (Latin or Arabic)
        // Iterate through ALL key groups to find a match in labels
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
                // Trim and compare to avoid issues with extra spaces in HTML
                if (arabicLabel && arabicLabel.textContent.trim() === searchKey) {
                    return button;
                }
            }
        }
        return null;
    }

    function isArabicChar(char) {
        if (!char) return false;
        // Check for common Arabic Unicode ranges
        return char.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    }

    function isLatinChar(char) {
        if (!char) return false;
        // Check for basic Latin and common extended Latin characters
        return char.match(/[a-zA-Z\u00C0-\u017F\u0180-\u024F\u1E00-\u1EFF]/);
    }

    // --- Core Conversion Logic for Physical Keyboard Input ---
    function convertCharToTifinagh(inputChar, prevChar = '') { // Added prevChar for digraph checks
        // Specific rules from previous requests (ensure they match your desired output)
        if (inputChar === 't') return 'ⵜ';
        if (inputChar === 'T') return 'ⵟ';
        if (inputChar === 's') return 'ⵙ';
        if (inputChar === 'S') return 'ⵚ';
        if (inputChar === 'd') return 'ⴷ';
        if (inputChar === 'D') return 'ⴹ';
        if (inputChar === 'c' || inputChar === 'C') return 'ⵛ';
        if (inputChar === 'g') return 'ⴳ';
        if (inputChar === 'G') return 'ⵖ'; // Assuming G for gh/ɣ

        // 1. Digraphs: Check if prevChar + inputChar forms a digraph
        if (prevChar && isLatinChar(prevChar) && isLatinChar(inputChar)) {
            const potentialDigraph = (prevChar + inputChar).toLowerCase();
            if (digraphMap[potentialDigraph]) {
                return digraphMap[potentialDigraph];
            }
        }

        // 2. Try exact match in shifted Latin (e.g., 'A' -> 'ⵄ')
        if (tifinaghShiftMap[inputChar] !== undefined) {
            return tifinaghShiftMap[inputChar];
        }

        // 3. Try lowercase Latin (e.g., 'a' -> 'ⴰ', 'L' -> 'ⵍ')
        if (isLatinChar(inputChar)) {
            const lowerChar = inputChar.toLowerCase();
            if (tifinaghMap[lowerChar] !== undefined) {
                return tifinaghMap[lowerChar];
            }
        }

        // 4. Try exact match for Arabic (e.g., 'ا' -> 'ⴰ')
        if (isArabicChar(inputChar)) {
            if (arabicToTifinaghMap[inputChar] !== undefined) {
                return arabicToTifinaghMap[inputChar];
            }
        }

        // 5. Handle space and newline directly if they somehow bypass other maps
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
            } else { // Removed 'enter' as it's not explicitly in your HTML,
                     // but you can add specific handling if you add an 'enter' button.
                insertAtCursor(keyboardInput, keyValue);
            }

            keyboardInput.focus();
            activateKeyAnimation(key); // Activate animation for clicked key
        });
    });

    // --- REVISED Keydown event listener for animations and conversion logic ---
    keyboardInput.addEventListener('keydown', (e) => {
        // Handle special keys first (Backspace, Enter, Space)
        let keyToAnimateSpecial = null;
        if (e.key === 'Enter') {
            keyToAnimateSpecial = findVirtualKeyElement('enter'); // Still assumes an 'enter' data-key exists for animation
            // --- FIX 2: Manually insert newline for Enter key ---
            e.preventDefault();
            insertAtCursor(keyboardInput, '\n');
        } else if (e.key === 'Backspace') {
            keyToAnimateSpecial = findVirtualKeyElement('backspace');
            e.preventDefault(); // Prevent default backspace
            deleteAtCursor(keyboardInput, 1);
        } else if (e.key === ' ') {
            keyToAnimateSpecial = findVirtualKeyElement(' ', 'tifinagh');
            e.preventDefault(); // Prevent default space insertion
            insertAtCursor(keyboardInput, ' '); // Manually insert space
        }

        if (keyToAnimateSpecial) {
            activateKeyAnimation(keyToAnimateSpecial);
            return; // Exit if a special key was handled
        }

        // Only proceed for single character inputs that are not control keys
        // --- FIX 3: Also ignore Shift key itself, as its effect is captured by case ---
        if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || e.key === 'Shift') {
            return; // Ignore other non-character, modifier, or Shift key combinations
        }

        const inputChar = e.key;
        const currentInputValue = keyboardInput.value;
        const cursorPosition = keyboardInput.selectionStart;

        let tifinaghToInsert = null;
        let charsToDelete = 0;

        // Attempt digraph matching BEFORE single character conversion
        // --- FIX 4: Corrected Digraph Logic ---
        // If the user typed 's' then 'h', we need to check if 'sh' is a digraph.
        // This requires looking at the character *before* the cursor and the *current* input.
        let prevChar = '';
        if (cursorPosition > 0) {
            prevChar = currentInputValue.substring(cursorPosition - 1, cursorPosition);
        }

        const potentialDigraph = (prevChar + inputChar).toLowerCase();

        if (digraphMap[potentialDigraph]) {
            tifinaghToInsert = digraphMap[potentialDigraph];
            charsToDelete = 1; // The previously typed character will be replaced
        } else {
            // If no digraph, try single character conversion
            tifinaghToInsert = convertCharToTifinagh(inputChar);
        }

        if (tifinaghToInsert) {
            e.preventDefault(); // Crucial: Prevent the browser's default insertion of the inputChar

            if (charsToDelete > 0) {
                deleteAtCursor(keyboardInput, charsToDelete);
            }
            insertAtCursor(keyboardInput, tifinaghToInsert);

            // Animate the corresponding virtual key
            // --- FIX 5: Improved Key Animation Logic for Physical Keyboard ---
            let keyToAnimate = null;

            // Prioritize animating the Tifinagh character itself
            keyToAnimate = findVirtualKeyElement(tifinaghToInsert, 'tifinagh');

            // Fallback: If Tifinagh character button not found, try animating based on Latin/Arabic label
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
        // If tifinaghToInsert is null, no conversion was found, and e.preventDefault() was not called.
        // This allows default browser behavior for unmapped keys (e.g., numbers, symbols).
    });

    // The 'input' event listener is primarily for non-keydown inputs (like paste)
    // and ensuring `previousValue` (if used) is current. It's less critical for the direct
    // typing conversion logic if keydown handles it with preventDefault.
    keyboardInput.addEventListener('input', () => {
        // You can add logic here for paste events or other non-keydown text changes if needed.
        // For direct typing, keydown is primary.
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
                            // --- FIX 6: Reset button HTML, not just textContent ---
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text';
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text using Clipboard API: ', err);
                        document.execCommand('copy'); // Fallback
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text';
                        }, 1500);
                    });
            } else {
                document.execCommand('copy'); // Fallback for older browsers/HTTP
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Tifinagh Text';
                }, 1500);
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

    // --- Focus and Blur handling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });

    // --- Dark Mode Toggle (ADDED AS PER PREVIOUS CONVERSATION, YOU CAN INTEGRATE THIS IF NEEDED) ---
    // Assuming you have the HTML for themeToggle, moonIcon, sunIcon
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

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
    // --- END Dark Mode Toggle ---
});

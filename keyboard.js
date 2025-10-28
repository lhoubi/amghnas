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
        'ـ': 'ـ', // Arabic Tatweel for ʷ
        'ڤ': 'ⵠ', // Added for 'v'
        'ڭ': 'ⴳ', // Added for 'g'
        'ك_for_C': 'ⵛ' // Special temporary entry, handled in convertCharToTifinagh
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
                if (arabicLabel && arabicLabel.textContent === searchKey) {
                    // Special handling for the 'ك' that maps to 'ⵛ'
                    if (searchKey === 'ك' && key.dataset.key === 'ⵛ') {
                        return key;
                    }
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
        return char.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/);
    }

    function isLatinChar(char) {
        if (!char) return false;
        return char.match(/[a-zA-Z\u00C0-\u017F]/);
    }

    // --- Core Conversion Logic for Physical Keyboard Input ---
    function convertCharToTifinagh(inputChar) {
        // Specific rules from previous requests
        if (inputChar === 't') return 'ⵜ';
        if (inputChar === 'T') return 'ⵟ';
        if (inputChar === 's') return 'ⵙ';
        if (inputChar === 'S') return 'ⵚ';
        if (inputChar === 'd') return 'ⴷ';
        if (inputChar === 'D') return 'ⴹ';
        if (inputChar === 'c' || inputChar === 'C') return 'ⵛ';
        if (inputChar === 'g') return 'ⴳ';
        if (inputChar === 'G') return 'ⵖ';

        // 1. Try exact match in shifted Latin (e.g., 'A' -> 'ⵄ')
        if (tifinaghShiftMap[inputChar] !== undefined) {
            return tifinaghShiftMap[inputChar];
        }
        // 2. Try exact match for Arabic (e.g., 'ا' -> 'ⴰ')
        if (isArabicChar(inputChar)) {
             if (inputChar === 'ك' && arabicToTifinaghMap['ك_for_C'] !== undefined) {
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

    // --- REVISED Keydown event listener for animations and conversion logic ---
    keyboardInput.addEventListener('keydown', (e) => {
        // Handle special keys first (Backspace, Enter, Space)
        let keyToAnimateSpecial = null;
        if (e.key === 'Enter') {
            keyToAnimateSpecial = findVirtualKeyElement('enter');
        } else if (e.key === 'Backspace') {
            keyToAnimateSpecial = findVirtualKeyElement('backspace');
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
        if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
            return; // Ignore other non-character or modifier key combinations
        }

        const inputChar = e.key;
        const currentInputValue = keyboardInput.value;
        const cursorPosition = keyboardInput.selectionStart;

        let tifinaghToInsert = null;
        let charsToDelete = 0;

        // 1. Check for Digraphs (if there's a preceding character to form one)
        if (cursorPosition > 0) {
            const lastCharBeforeCursor = currentInputValue.substring(cursorPosition - 1, cursorPosition);
            // Try forming digraphs with the Latin representation if possible
            const potentialDigraphLatin = (lastCharBeforeCursor + inputChar).toLowerCase();
            
            if (digraphMap[potentialDigraphLatin]) {
                tifinaghToInsert = digraphMap[potentialDigraphLatin];
                charsToDelete = 1; // The last character in the input will be replaced
            }
        }

        // 2. If not a digraph, try single character conversion
        if (!tifinaghToInsert) {
            tifinaghToInsert = convertCharToTifinagh(inputChar);
        }
        
        if (tifinaghToInsert) {
            e.preventDefault(); // Crucial: Prevent the browser's default insertion of the inputChar

            if (charsToDelete > 0) {
                deleteAtCursor(keyboardInput, charsToDelete);
            }
            insertAtCursor(keyboardInput, tifinaghToInsert);

            // Animate the corresponding virtual key
            let keyToAnimate = findVirtualKeyElement(tifinaghToInsert, 'tifinagh');
            let sourceKeyToAnimate = findVirtualKeyElement(inputChar, isLatinChar(inputChar) ? 'latin' : 'arabic');
            
            if (sourceKeyToAnimate) {
                activateKeyAnimation(sourceKeyToAnimate);
            } else if (keyToAnimate) {
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
        });
    }

    // --- Focus and Blur handling ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });
});

if (!keyboardInput) {
    console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
    return;
}

// --- Tifinagh Mapping (for Latin input - all lowercase base characters) ---
// This map should contain the base Tifinagh for standard lowercase Latin letters.
const tifinaghMap = {
    'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
    'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
    'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
    's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
    'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
    ' ': ' ' // Space key
};

// --- Shifted/Capitalized Tifinagh Mapping (for distinct shifted outputs) ---
// Only put capital letters here if they map to a *different* Tifinagh character than their lowercase.
// E.g., 'A' -> 'ⵄ' (different from 'a' -> 'ⴰ')
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
    // The HTML for L and C in row 1 and 3 are just labels, not necessarily unique mappings.
    // We ensure 'l' maps to 'ⵍ' and 'c' maps to 'ⵛ' in tifinaghMap.
};

// --- Digraph Map (Longest matches first for Latin conversion logic) ---
// Ensure these are all lowercase for consistent matching.
const digraphMap = {
    'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
    'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
    // Add more if needed, e.g., 'zh' for 'ⵥ' if applicable
};

// --- Arabic to Tifinagh Mapping ---
// Ensure completeness based on your HTML labels.
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
    // Specific 'ك' mapping for ⵛ, as seen in HTML
    // This is tricky. If 'ك' can be 'ⴽ' OR 'ⵛ', you need a rule.
    // For now, I'll assume standard 'ك' -> 'ⴽ', and 'C' key maps explicitly to 'ⵛ'.
    // If an Arabic 'ك' should sometimes be 'ⵛ', it might need a shifted Arabic input or context.
    // Based on your HTML: <span class="arabic-label">ك</span> <button class="keyboard-key" data-key="ⵛ">
    // This implies 'ك' can also map to 'ⵛ'. Let's add it carefully.
    'ك_for_C': 'ⵛ' // Special temporary entry, handled in convertCharToTifinagh
};

/**
 * Activates the 'fire-active' animation on a given key element.
 * @param {HTMLElement} keyElement The virtual keyboard button to animate.
 */
function activateKeyAnimation(keyElement) {
    if (keyElement) {
        keyElement.classList.remove('fire-active');
        void keyElement.offsetWidth;
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
            // Check if label exists and text content matches searchKey
            if (arabicLabel && arabicLabel.textContent === searchKey) {
                // Special handling for the 'ك' that maps to 'ⵛ'
                if (searchKey === 'ك' && key.dataset.key === 'ⵛ') {
                    return key;
                }
                // For general Arabic mapping
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
    // Extend to cover more specific Arabic diacritics if necessary.
    return char.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/);
}

function isLatinChar(char) {
    if (!char) return false;
    // Basic Latin alphabet, including some common extended Latin characters if needed
    return char.match(/[a-zA-Z\u00C0-\u017F]/);
}

// --- Core Conversion Logic for Physical Keyboard Input ---
function convertCharToTifinagh(inputChar) {
    // 1. Try exact match in shifted Latin (e.g., 'A' -> 'ⵄ')
    if (tifinaghShiftMap[inputChar] !== undefined) {
        return tifinaghShiftMap[inputChar];
    }
    // 2. Try exact match for Arabic (e.g., 'ا' -> 'ⴰ')
    if (isArabicChar(inputChar)) {
         // Handle 'ك' specifically if it should map to 'ⵛ' in certain contexts
         if (inputChar === 'ك' && arabicToTifinaghMap['ك_for_C'] !== undefined) {
             // This is a heuristic. In a real scenario, you might need a modifier key for this.
             // For now, if 'ك' is typed, we can prioritize the 'ⵛ' if it's explicitly desired.
             // Or, if it's meant to be default 'ⴽ', then don't put 'ك_for_C' in map.
             // Given your HTML for C -> ⵛ, it means if Arabic 'ك' is typed, it should yield ⵛ.
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
        activateKeyAnimation(key);
    });
});

let pendingDigraphChar = ''; // Stores the first char of a potential digraph

// --- Keydown event listener for animations and conversion logic ---
keyboardInput.addEventListener('keydown', (e) => {
    // --- Animate virtual key ---
    let keyToAnimate = null;
    if (e.key === 'Enter') {
        keyToAnimate = findVirtualKeyElement('enter');
    } else if (e.key === 'Backspace') {
        keyToAnimate = findVirtualKeyElement('backspace');
    } else if (e.key === ' ') {
        keyToAnimate = findVirtualKeyElement(' ', 'tifinagh');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // First try to animate the Latin/Arabic source key
        keyToAnimate = findVirtualKeyElement(e.key, isLatinChar(e.key) ? 'latin' : 'arabic');
        if (!keyToAnimate) {
            // If no direct source key, try to animate the resulting Tifinagh char
            const potentialTifinagh = convertCharToTifinagh(e.key);
            if (potentialTifinagh) {
                keyToAnimate = findVirtualKeyElement(potentialTifinagh, 'tifinagh');
            }
        }
    }
    if (keyToAnimate) {
        activateKeyAnimation(keyToAnimate);
    }

    // --- Core conversion logic for physical character keys ---
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const inputChar = e.key;
        let charHandled = false;

        // 1. Digraph Handling: Check if the current char completes a pending digraph
        if (pendingDigraphChar) {
            const potentialDigraph = (pendingDigraphChar + inputChar).toLowerCase();
            const digraphResult = digraphMap[potentialDigraph];
            if (digraphResult) {
                e.preventDefault(); // Prevent current char from being inserted
                deleteAtCursor(keyboardInput, 1); // Delete the temporarily inserted pendingDigraphChar
                insertAtCursor(keyboardInput, digraphResult); // Insert the Tifinagh digraph
                charHandled = true;
                pendingDigraphChar = '';
                // Animate the resulting Tifinagh digraph character
                let digraphKey = findVirtualKeyElement(digraphResult, 'tifinagh');
                if (digraphKey) activateKeyAnimation(digraphKey);
            } else {
                // If current char doesn't form a digraph, the pendingChar stays as a single char (already inserted).
                // We just clear pendingDigraphChar so it doesn't try to form digraphs with subsequent chars.
                pendingDigraphChar = '';
            }
        }

        // 2. Single Character Conversion: If not handled by digraph, try single char conversion
        if (!charHandled) {
            const convertedChar = convertCharToTifinagh(inputChar);

            if (convertedChar) { // If a Tifinagh equivalent was found
                // Check if this character could START a digraph.
                let couldStartDigraph = false;
                for (const digraphPrefix in digraphMap) {
                    if (digraphPrefix.startsWith(inputChar.toLowerCase()) && digraphPrefix.length > 1) {
                        couldStartDigraph = true;
                        break;
                    }
                }

                if (couldStartDigraph) {
                    pendingDigraphChar = inputChar;
                    // Allow browser to insert the character temporarily. No e.preventDefault().
                } else {
                    e.preventDefault(); // Prevent the browser from inserting the original char
                    insertAtCursor(keyboardInput, convertedChar); // Insert the Tifinagh char
                    pendingDigraphChar = '';
                }
            } else {
                // No Tifinagh conversion found. Allow browser default (e.g., numbers, symbols, unmapped chars)
                pendingDigraphChar = '';
            }
        }
    } else {
        // For non-character keys, clear pending digraph state
        pendingDigraphChar = '';
    }
});

// The 'input' event listener is truly passive for physical keyboard character inputs.
keyboardInput.addEventListener('input', () => {
    // This is primarily for non-keydown inputs (like paste) or to ensure `previousValue` is current.
    previousValue = keyboardInput.value;
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
        previousValue = '';
        pendingDigraphChar = '';
    });
}

// --- Focus and Blur handling ---
keyboardInput.addEventListener('focus', () => {
    keyboardInput.classList.add('focused');
    previousValue = keyboardInput.value;
});
keyboardInput.addEventListener('blur', () => {
    keyboardInput.classList.remove('focused');
    pendingDigraphChar = '';
});

// Initialize previousValue on page load after all setup
previousValue = keyboardInput.value;

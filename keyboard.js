document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key'); // Selects ALL keyboard keys
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' textarea not found. Please ensure your HTML has <textarea id='keyboardInput'>.");
        return;
    }

    // --- Tifinagh Mapping (for Latin input) ---
    const tifinaghMap = {
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ',
        'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ', // Space key
        '\n': '\n' // Enter key (newline)
    };

    // --- Shifted/Capitalized Tifinagh Mapping (for Latin input) ---
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
    };

    // --- Digraph Map (Longest matches first for Latin conversion logic) ---
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
    };

    // --- NEW: Arabic to Tifinagh Mapping ---
    // This map defines the Arabic-to-Tifinagh conversions.
    // This is a direct mapping as requested. Adjust specific mappings as needed.
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ', 'ج': 'ⴳ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ', 'ر': 'ⵔ', 'ز': 'ⵣ', 'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ',
        'ض': 'ⴹ', 'ط': 'ⵟ', 'ظ': 'ⴹ', 'ع': 'ⵄ', 'غ': 'ⵖ', 'ف': 'ⴼ',
        'ق': 'ⵇ', 'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ', 'ه': 'ⵀ', 'و': 'ⵡ',
        'ي': 'ⵢ', 'ؤ': 'ⵓ', 'ئ': 'ⵉ', 'ة': 'ⴻ', 'أ': 'ⴰ', 'إ': 'ⵉ', 'آ': 'ⴰ',
        'ء': 'ⴻ', // Hamza often mapped to E or not converted
        'ـ': '-', // Tatweel for hyphen
        ' ': ' ', // Space
        '\n': '\n', // Newline

        // Common Arabic ligatures or combined characters that might be typed
        'لا': 'ⵍⴰ',
        'لأ': 'ⵍⴰ'
    };


    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted.
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ',
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace'
    };

    // Function to highlight a virtual key temporarily
    function highlightKey(tifinaghChar) {
        const virtualKeyData = tifinaghCharToVirtualKeyMap[tifinaghChar];
        if (virtualKeyData) {
            const matchingKey = document.querySelector(`.keyboard-key[data-key="${virtualKeyData}"]`);
            if (matchingKey) {
                matchingKey.classList.add('active');
                setTimeout(() => {
                    matchingKey.classList.remove('active');
                }, 150);
            }
        }
    }

    // --- Helper to detect if a string contains Arabic characters ---
    function containsArabic(text) {
        // Regex to match Arabic script characters (including presentation forms, extended, etc.)
        // This is a broad range. Adjust if you need a more specific set.
        return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    }

    // --- Core Conversion Function: Latin to Tifinagh with cursor tracking ---
    function convertLatinToTifinagh(latinText, originalCursorPos) {
        let tifinaghResult = '';
        let currentLatinIndex = 0;
        let newCursorPos = 0;

        while (currentLatinIndex < latinText.length) {
            let foundMapping = false;
            let charToProcess = latinText[currentLatinIndex]; // Default to single char

            // Try to match digraphs first (longest matches first)
            for (const digraph in digraphMap) {
                if (latinText.substring(currentLatinIndex, currentLatinIndex + digraph.length).toLowerCase() === digraph) {
                    tifinaghResult += digraphMap[digraph];
                    if (currentLatinIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                    currentLatinIndex += digraph.length;
                    foundMapping = true;
                    break;
                }
            }

            if (!foundMapping) {
                // If no digraph, try single character mapping
                const char = latinText[currentLatinIndex];
                let mappedChar = tifinaghShiftMap[char]; // Check for case-sensitive first (e.g., 'A' for shifted)
                if (!mappedChar) { // If no case-sensitive match, try regular map
                    mappedChar = tifinaghMap[char.toLowerCase()];
                }

                if (mappedChar) {
                    tifinaghResult += mappedChar;
                    if (currentLatinIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                } else {
                    // If no Tifinagh mapping, keep the original character
                    tifinaghResult += char;
                    if (currentLatinIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                }
                currentLatinIndex++;
            }
        }
        return { text: tifinaghResult, cursorPos: newCursorPos };
    }

    // --- NEW: Core Conversion Function: Arabic to Tifinagh with cursor tracking ---
    function convertArabicToTifinagh(arabicText, originalCursorPos) {
        let tifinaghResult = '';
        let currentArabicIndex = 0;
        let newCursorPos = 0;

        // Sort Arabic map keys by length descending to handle ligatures/longer sequences first
        const sortedArabicKeys = Object.keys(arabicToTifinaghMap).sort((a, b) => b.length - a.length);

        while (currentArabicIndex < arabicText.length) {
            let foundMapping = false;

            // Try to match longer sequences (like 'لا') first
            for (const arabicKey of sortedArabicKeys) {
                if (arabicText.substring(currentArabicIndex, currentArabicIndex + arabicKey.length) === arabicKey) {
                    tifinaghResult += arabicToTifinaghMap[arabicKey];
                    if (currentArabicIndex < originalCursorPos) {
                        newCursorPos++;
                    }
                    currentArabicIndex += arabicKey.length;
                    foundMapping = true;
                    break;
                }
            }

            if (!foundMapping) {
                // If no specific mapping, keep the original character (e.g., numbers, punctuation, chars not in map)
                const char = arabicText[currentArabicIndex];
                tifinaghResult += char;
                if (currentArabicIndex < originalCursorPos) {
                    newCursorPos++;
                }
                currentArabicIndex++;
            }
        }
        return { text: tifinaghResult, cursorPos: newCursorPos };
    }


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const start = keyboardInput.selectionStart;
            const end = keyboardInput.selectionEnd;
            let newValue = keyboardInput.value;
            let newCursorPos = start;

            let charToInsert = '';
            let tifinaghCharForHighlight = '';

            // Check if it's a Tifinagh key
            if (key.dataset.key) {
                const keyValue = key.dataset.key;
                if (keyValue === 'backspace') {
                    if (start === end) { // No text selected, delete preceding character
                        if (start > 0) {
                            newValue = newValue.substring(0, start - 1) + newValue.substring(end);
                            newCursorPos = start - 1;
                        }
                    } else { // Text is selected, delete selected text
                        newValue = newValue.substring(0, start) + newValue.substring(end);
                        newCursorPos = start;
                    }
                    tifinaghCharForHighlight = 'backspace';
                } else {
                    charToInsert = keyValue; // Directly insert Tifinagh
                    newValue = newValue.substring(0, start) + charToInsert + newValue.substring(end);
                    newCursorPos = start + charToInsert.length;
                    tifinaghCharForHighlight = charToInsert;
                }
            }
            // Check if it's an Arabic key
            else if (key.dataset.keyArabic && key.dataset.tifinaghMap) {
                charToInsert = key.dataset.tifinaghMap; // Insert the mapped Tifinagh character
                newValue = newValue.substring(0, start) + charToInsert + newValue.substring(end);
                newCursorPos = start + charToInsert.length;
                tifinaghCharForHighlight = charToInsert;
            } else if (key.classList.contains('delete')) { // Generic delete for arabic row
                 if (start === end) {
                    if (start > 0) {
                        newValue = newValue.substring(0, start - 1) + newValue.substring(end);
                        newCursorPos = start - 1;
                    }
                } else {
                    newValue = newValue.substring(0, start) + newValue.substring(end);
                    newCursorPos = start;
                }
                tifinaghCharForHighlight = 'back

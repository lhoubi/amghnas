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
    // Adjusted some mappings for better common use (e.g., ث->ⵜ, ذ->ⴷ, etc.)
    const arabicToTifinaghMap = {
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', // Alef variations
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⴳ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ', // ض often ⴹ
        'ط': 'ⵟ', 'ظ': 'ⵥ', // ظ often ⵥ or ⴹ depending on dialect
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'و': 'ⵡ', 'ي': 'ⵢ',
        'ة': 'ⴻ', 'ى': 'ⵉ', // Taa marbuta to E, Alef maqsuura to I
        'ء': '', // Hamza can often be ignored or mapped to ⴻ
        'ؤ': 'ⵓ', 'ئ': 'ⵉ', // Hamza on waw/yaa to U/I

        // Punctuation and special characters
        ' ': ' ', // Space
        '\n': '\n', // Newline
        'ـ': 'ـ', // Tatweel as a hyphen/elongation
        ',': ',', '.': '.', ';': ';', '/': '/', '?': '?', '!': '!', '(': '(', ')': ')',
        // Common ligatures or combined characters that might be typed in Arabic and need a Tifinagh equivalent
        'لا': 'ⵍⴰ', // lam-alef
        'لأ': 'ⵍⴰ',
        'لإ': 'ⵍⵉ',
        'لآ': 'ⵍⴰ'
    };


    // Mapping to highlight the correct virtual key based on the Tifinagh character inserted.
    // Also include mapping for Arabic characters to highlight their *corresponding* Tifinagh key.
    const tifinaghCharToVirtualKeyMap = {
        'ⴰ': 'ⴰ', 'ⴱ': 'ⴱ', 'ⵛ': 'ⵛ', 'ⴷ': 'ⴷ', 'ⴻ': 'ⴻ', 'ⴼ': 'ⴼ',
        'ⴳ': 'ⴳ', 'ⵀ': 'ⵀ', 'ⵉ': 'ⵉ', 'ⵊ': 'ⵊ', 'ⴽ': 'ⴽ', 'ⵍ': 'ⵍ',
        'ⵎ': 'ⵎ', 'ⵏ': 'ⵏ', 'ⵒ': 'ⵒ', 'ⵇ': 'ⵇ', 'ⵔ': 'ⵔ', 'ⵙ': 'ⵙ',
        'ⵜ': 'ⵜ', 'ⵓ': 'ⵓ', 'ⵠ': 'ⵠ', 'ⵡ': 'ⵡ', 'ⵅ': 'ⵅ', 'ⵢ': 'ⵢ',
        'ⵣ': 'ⵣ', 'ⵖ': 'ⵖ', 'ⴹ': 'ⴹ', 'ⵃ': 'ⵃ', 'ⵚ': 'ⵚ', 'ⵥ': 'ⵥ',
        'ⵄ': 'ⵄ', 'ⵕ': 'ⵕ', 'ⵟ': 'ⵟ', 'ⵯ': 'ⵯ', 'ـ': 'ـ', // Tatweel
        ' ': ' ', '\n': 'enter', 'backspace': 'backspace'
    };

    // Function to highlight a virtual key temporarily
    // Now also finds keys by their data-arabic-key for physical Arabic input
    function highlightKey(tifinaghCharOrLatinCharOrArabicChar) {
        let matchingKey = null;

        // Try to find by direct Tifinagh data-key
        matchingKey = document.querySelector(`.keyboard-key[data-key="${tifinaghCharOrLatinCharOrArabicChar}"]`);

        if (!matchingKey) {
            // If not found, try to find by the Tifinagh character *that would be produced*
            // from Latin or Arabic input. This is more complex and might not always match
            // a specific button if the mapping is many-to-one (e.g., 'A' and 'ⵄ' map to ⵄ)
            // For virtual keys, `tifinaghCharToVirtualKeyMap` handles this.
            // For physical input, we need to map the *input* character back to a Tifinagh key.
            // This is a heuristic, and might need refinement for perfect 1:1 visual feedback.

            const mappedTifinaghForLatin = tifinaghMap[tifinaghCharOrLatinCharOrArabicChar.toLowerCase()] || tifinaghShiftMap[tifinaghCharOrLatinCharOrArabicChar];
            if (mappedTifinaghForLatin) {
                matchingKey = document.querySelector(`.keyboard-key[data-key="${mappedTifinaghForLatin}"]`);
            }

            if (!matchingKey) {
                 const mappedTifinaghForArabic = arabicToTifinaghMap[tifinaghCharOrLatinCharOrArabicChar];
                 if (mappedTifinaghForArabic) {
                    matchingKey = document.querySelector(`.keyboard-key[data-key="${mappedTifinaghForArabic}"]`);
                 }
            }

            // Fallback for `backspace`
            if (!matchingKey && tifinaghCharOrLatinCharOrArabicChar === 'backspace') {
                matchingKey = document.querySelector(`.keyboard-key[data-key="backspace"]`);
            }
        }


        if (matchingKey) {
            matchingKey.classList.add('active');
            setTimeout(() => {
                matchingKey.classList.remove('active');
            }, 150);
        }
    }


    // --- Helper to detect if a string contains Arabic characters ---
    // Improved regex to be more accurate for detecting presence of Arabic script
    function containsArabic(text) {
        return /[\u0600-\u06FF]/.test(text); // Basic Arabic script range
    }

    // --- Helper to detect if a string contains Latin characters ---
    function containsLatin(text) {
        return /[a-zA-Z]/.test(text);
    }

    // --- Core Conversion Function (Latin to Tifinagh with cursor tracking) ---
    function convertLatinToTifinagh(latinText, originalCursorPos) {
        let tifinaghResult = '';
        let currentLatinIndex = 0;
        let newCursorPos = 0;

        while (currentLatinIndex < latinText.length) {
            let foundMapping = false;
            let char = latinText[currentLatinIndex];

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
                let mappedChar = tifinaghShiftMap[char]; // Check for case-sensitive first (e.g., 'A' for shifted)
                if (!mappedChar) { // If no case-sensitive match, try regular map
                    mappedChar = tifinaghMap[char.toLowerCase()];
                }

                if (mappedChar !== undefined) { // Check for undefined, allows empty string mapping for hamza etc.
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

    // --- Core Conversion Function (Arabic to Tifinagh with cursor tracking) ---
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
                    const mappedChar = arabicToTifinaghMap[arabicKey];
                    tifinaghResult += mappedChar;
                    if (currentArabicIndex < originalCursorPos) {
                        newCursorPos += mappedChar.length; // Adjust cursor based on length of mapped char
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

            const keyValue = key.dataset.key; // This will always be the Tifinagh char for Tifinagh keys, or ' ' or 'backspace'
            let charForHighlight = keyValue; // Default for Tifinagh keys

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
            } else {
                newValue = newValue.substring(0, start) + keyValue + newValue.substring(end);
                newCursorPos = start + keyValue.length;
            }

            keyboardInput.value = newValue;
            keyboardInput.selectionStart = keyboardInput.selectionEnd = newCursorPos;
            keyboardInput.focus();

            highlightKey(charForHighlight); // Highlight the Tifinagh key that was conceptually pressed/inserted
        });
    });


    // --- Real-time Conversion on Input (for both physical and mobile native keyboards) ---
    let ignoreNextInput = false; // Flag to prevent re-entrancy during our own updates

    function processInputAndConvert() {
        if (ignoreNextInput) return; // Skip if we are programmatically updating

        const originalInput = keyboardInput.value;
        const originalCursorPos = keyboardInput.selectionStart;

        let convertedText = originalInput;
        let newCursorPos = originalCursorPos;
        let lastCharInserted = '';

        // Determine if the primary input mode is Arabic or Latin
        // This is a heuristic: check the character *just before* the cursor.
        // If it's Arabic, assume Arabic input for this segment.
        // If it's Latin, assume Latin input.
        // If it's empty, or mixed, the logic needs to decide.
        // For simplicity, we'll convert the *entire string* based on detection of Arabic characters.
        // If any Arabic chars are present, it tries Arabic conversion first.
        // This means mixing Latin and Arabic in one word might prioritize Arabic if detected.

        if (containsArabic(originalInput)) {
            const conversionResult = convertArabicToTifinagh(originalInput, originalCursorPos);
            convertedText = conversionResult.text;
            newCursorPos = conversionResult.cur...

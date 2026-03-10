// converter.js

// Ensure all DOM operations happen after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get DOM Elements (UPDATED IDs to match index.html) ---
    // Tifinagh to Talatint (Old Latin)
    const tifinaghInput = document.getElementById('tifinaghInputMain');
    const talatintOutput = document.getElementById('talatintOutput');


    const talatintInput = document.getElementById('talatintInputMain');
    const tifinaghTalatintOutput = document.getElementById('tifinaghTalatintOutput');

        // --- Error Checking for essential elements ---
    if (!tifinaghInput || !talatintOutput || !talatintInput || !tifinaghTalatintOutput) {
        console.error('Converter: essential elements missing.');
        return;
    }


    // --- Mapping Definitions ---

    // Map Tifinagh characters directly to the desired EXTENDED Talatint characters.
    // This ensures characters with "points under" are preserved.
    const tifinaghToExtendedTalatintMap = {
        'ⴰ': 'a', 'ⴱ': 'b', 'ⴳ': 'g', 'ⴷ': 'd', 'ⴹ': 'ḍ', // Emphatic D
        'ⴻ': 'e', 'ⴼ': 'f', 'ⴽ': 'k', 'ⵀ': 'h', 'ⵃ': 'ḥ', // Emphatic H
        'ⵄ': 'ɛ', 'ⵅ': 'x', 'ⵇ': 'q', 'ⵉ': 'i', 'ⵊ': 'j',
        'ⵍ': 'l', 'ⵎ': 'm', 'ⵏ': 'n', 'ⵠ': 'v', 'ⵓ': 'u',
        'ⵔ': 'r', 'ⵕ': 'ṛ', // Emphatic R
        'ⵖ': 'ɣ', // Gamma
        'ⵙ': 's', 'ⵚ': 'ṣ', // Emphatic S
        'ⵛ': 'š', // Sh
        'ⵜ': 't', 'ⵟ': 'ṭ', // Emphatic T
        'ⵝ': 'th', 'ⵞ': 'č', // Ch
        'ⵡ': 'w', 'ⵢ': 'y', 'ⵣ': 'z', 'ⵥ': 'ẓ', // Emphatic Z
        'ⵒ': 'p',
        ' ': ' ', // Space
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-', // Punctuation
    };

    // --- Talatint → Tifinagh Map ---
    const talatintToTifinaghMap = {
        'ḍ': 'ⴹ', 'ḥ': 'ⵃ', 'ṛ': 'ⵕ', 'ṣ': 'ⵚ', 'ṭ': 'ⵟ', 'ẓ': 'ⵥ',
        'ɣ': 'ⵖ', 'š': 'ⵛ', 'č': 'ⵞ', 'ɛ': 'ⵄ', 'ž': 'ⵥ',
        // Digraphs — checked before single chars because keys are sorted by length
        'kh': 'ⵅ', 'gh': 'ⵖ', 'sh': 'ⵛ', 'ch': 'ⵛ',
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⵛ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ',
        'g': 'ⴳ', 'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ',
        'm': 'ⵎ', 'n': 'ⵏ', 'o': 'ⵓ', 'p': 'ⵒ', 'q': 'ⵇ', 'r': 'ⵔ',
        's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ', 'w': 'ⵡ',
        'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',
        ' ': ' ', '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-',
    };

        // --- Conversion Functions ---

    /**
     * Converts Tifinagh text to "Talatint" (extended Latin style).
     * @param {string} tifinaghText - The input text in Tifinagh.
     * @returns {string} The converted text in extended Talatint.
     */
    function convertTifinaghToTalatint(tifinaghText) {
        let extendedTalatintResult = '';

        for (let i = 0; i < tifinaghText.length; i++) {
            const char = tifinaghText[i];
            extendedTalatintResult += tifinaghToExtendedTalatintMap[char] || char;
        }

        extendedTalatintResult = extendedTalatintResult.toLowerCase(); // Ensure lowercase

        // No diacritic stripping here, to preserve 'ḍ', 'ṭ', etc.
        return extendedTalatintResult;
    }


    function convertTalatintToTifinagh(text) {
        text = text.toLowerCase();
        let result = '';
        const sorted = Object.keys(talatintToTifinaghMap).sort((a, b) => b.length - a.length);
        let i = 0;
        while (i < text.length) {
            let matched = false;
            for (const key of sorted) {
                if (text.substring(i, i + key.length) === key) {
                    result += talatintToTifinaghMap[key];
                    i += key.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) { result += text[i]; i++; }
        }
        return result;
    }

        // --- Event Listeners for Immediate Conversion ---

    // Tifinagh to Talatint conversion (unchanged, still uses tifinaghToExtendedTalatintMap)
    if (tifinaghInput && talatintOutput) {
        tifinaghInput.addEventListener('input', () => {
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        });
    }



    // Talatint → Tifinagh conversion
    if (talatintInput && tifinaghTalatintOutput) {
        talatintInput.addEventListener('input', () => {
            tifinaghTalatintOutput.value = convertTalatintToTifinagh(talatintInput.value);
        });
    }


}); // End of DOMContentLoaded


// --- Arabic → Tifinagh Converter ---
document.addEventListener('DOMContentLoaded', () => {
    const arabicInput = document.getElementById('arabicInputMain');
    const arabicTifinaghOutput = document.getElementById('arabicTifinaghOutput');
    if (!arabicInput || !arabicTifinaghOutput) return;

    const arabicToTifinaghMap = {
        'لا': 'ⵍⴰ',
        'ا': 'ⴰ', 'أ': 'ⴰ', 'آ': 'ⴰ', 'إ': 'ⵉ',
        'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ',
        'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ',
        'د': 'ⴷ', 'ذ': 'ⴷ',
        'ر': 'ⵔ', 'ز': 'ⵣ',
        'س': 'ⵙ', 'ش': 'ⵛ', 'ص': 'ⵚ', 'ض': 'ⴹ',
        'ط': 'ⵟ', 'ظ': 'ⴹ',
        'ع': 'ⵄ', 'غ': 'ⵖ',
        'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ',
        'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ',
        'ه': 'ⵀ', 'ة': 'ⴻ', 'و': 'ⵡ',
        'ي': 'ⵢ', 'ى': 'ⵉ',
        'ء': 'ⴻ', 'ؤ': 'ⵓ', 'ئ': 'ⵉ',
        'ڤ': 'ⵠ', 'ڭ': 'ⴳ',
        // Strip diacritics (tashkeel) silently
        '\u064B': '', '\u064C': '', '\u064D': '', '\u064E': '',
        '\u064F': '', '\u0650': '', '\u0651': '', '\u0652': '',
        ' ': ' ', '.': '.', ',': ',', '،': ',', '؟': '?',
        '!': '!', ':': ':', ';': ';', '-': '-',
    };

    function convertArabicToTifinagh(text) {
        const sorted = Object.keys(arabicToTifinaghMap).sort((a, b) => b.length - a.length);
        let result = '';
        let i = 0;
        while (i < text.length) {
            let matched = false;
            for (const key of sorted) {
                if (text.substring(i, i + key.length) === key) {
                    result += arabicToTifinaghMap[key];
                    i += key.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) { i++; } // skip unmapped chars silently
        }
        return result;
    }

    arabicInput.addEventListener('input', () => {
        arabicTifinaghOutput.value = convertArabicToTifinagh(arabicInput.value);
    });
});

// converter.js

// Ensure all DOM operations happen after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get DOM Elements (UPDATED IDs to match index.html) ---
    // Tifinagh to Talatint (Old Latin)
    const tifinaghInput = document.getElementById('tifinaghInputMain'); // *** CHANGED ID ***
    const talatintOutput = document.getElementById('talatintOutput');

    // Latin to Tifinagh
    const latinInput = document.getElementById('latinInputMain');     // *** CHANGED ID ***
    const tifinaghLatinOutput = document.getElementById('tifinaghLatinOutput');

    // --- Error Checking for essential elements ---
    if (!tifinaghInput || !talatintOutput || !latinInput || !tifinaghLatinOutput) {
        console.error("Error: One or more essential input/output elements not found in index.html for converter.js.");
        // We'll proceed, but conversion won't work without these.
    }


    // --- Mapping Definitions ---

    // Map Tifinagh characters to a standard Latin transliteration
    const tifinaghToStandardLatinMap = {
        'ⴰ': 'a', 'ⴱ': 'b', 'ⴳ': 'g', 'ⴷ': 'd', 'ⴹ': 'ḍ', 'ⴻ': 'e', 'ⴼ': 'f',
        'ⴽ': 'k', 'ⵀ': 'h', 'ⵃ': 'ḥ', 'ⵄ': 'ɛ', 'ⵅ': 'x', 'ⵇ': 'q', 'ⵉ': 'i',
        'ⵊ': 'j', 'ⵍ': 'l', 'ⵎ': 'm', 'ⵏ': 'n', 'ⵠ': 'v', 'ⵓ': 'u', 'ⵔ': 'r',
        'ⵕ': 'ṛ', 'ⵖ': 'ɣ', 'ⵙ': 's', 'ⵚ': 'ṣ', 'ⵛ': 'sh', 'ⵜ': 't', 'ⵟ': 'ṭ',
        'ⵝ': 'th', 'ⵞ': 'ch', 'ⵡ': 'w', 'ⵢ': 'y', 'ⵣ': 'z', 'ⵥ': 'ẓ', 'ⵒ': 'p',
        ' ': ' ', // Space
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-', // Punctuation
    };

    // Map standard Latin letters (and common digraphs) to Tifinagh
    const standardLatinToTifinaghMap = {
        // Longest matches first for accurate digraph conversion
        'ch': 'ⵛ', 'ḍ': 'ⴹ', 'gh': 'ⵖ', 'ḥ': 'ⵃ', 'kh': 'ⵅ', 'ph': 'ⴼ', 'q': 'ⵇ',
        'sh': 'ⵛ', 'ṣ': 'ⵚ', 'ţ': 'ⵟ', 'ṭ': 'ⵟ', 'th': 'ⵝ', 'zh': 'ⵥ', 'ẓ': 'ⵥ',
        'ts': 'ⵜⵙ', 'dz': 'ⴷⵣ',

        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⴽ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ', 'g': 'ⴳ',
        'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
        'o': 'ⵓ', 'p': 'ⵒ', 'r': 'ⵔ', 's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ',
        'w': 'ⵡ', 'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ', 'ɛ': 'ⵄ', // Assuming 'ɛ' is mapped
        ' ': ' ',
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-',
    };


    // --- Conversion Functions ---

    /**
     * Converts Tifinagh text to a "Talatint" (Old Latin style) script.
     * @param {string} tifinaghText - The input text in Tifinagh.
     * @returns {string} The converted text in Talatint.
     */
    function convertTifinaghToTalatint(tifinaghText) {
        let standardLatinTransliteration = '';

        for (let i = 0; i < tifinaghText.length; i++) {
            const char = tifinaghText[i];
            standardLatinTransliteration += tifinaghToStandardLatinMap[char] || char;
        }

        let talatintText = standardLatinTransliteration.toLowerCase(); // Ensure lowercase

        // These rules are already handled by the initial mapping, or are identity transforms
        // Rule 2: 'ⵓ' for 'u' (lowercase) - 'u' is already 'u' in the map, so this is redundant.
        // talatintText = talatintText.replace(/u/g, 'u');
        // Rule 3: 'i' for 'j' (lowercase) - You map 'j' to 'j' in tifinaghToStandardLatinMap, then convert 'j' to 'i' here.
        // If you want 'ⵊ' -> 'i', change 'ⵊ': 'j' to 'ⵊ': 'i' in tifinaghToStandardLatinMap.
        // For now, I'll keep your replace, but consider direct mapping.
        talatintText = talatintText.replace(/j/g, 'i');


        // Rule 4: Remove any common modern diacritics
        talatintText = talatintText
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        return talatintText;
    }

    /**
     * Converts Latin text to Tifinagh script.
     * @param {string} latinText - The input text in Latin script.
     * @returns {string} The converted text in Tifinagh.
     */
    function convertLatinToTifinagh(latinText) {
        let tifinaghResult = '';
        let lowerCaseLatinText = latinText.toLowerCase();
        let i = 0;

        // Sort keys by length in descending order to handle digraphs before single characters
        // (e.g., 'sh' before 's' or 'h')
        const sortedKeys = Object.keys(standardLatinToTifinaghMap).sort((a, b) => b.length - a.length);

        while (i < lowerCaseLatinText.length) {
            let converted = false;

            for (const key of sortedKeys) {
                if (lowerCaseLatinText.substring(i, i + key.length) === key) {
                    tifinaghResult += standardLatinToTifinaghMap[key];
                    i += key.length;
                    converted = true;
                    break;
                }
            }

            if (!converted) {
                // If no mapping, just append the original character (e.g., numbers, unmapped punctuation)
                tifinaghResult += lowerCaseLatinText[i];
                i++;
            }
        }
        return tifinaghResult;
    }


    // --- Event Listeners for Immediate Conversion (Physical Keyboard Input on index.html) ---

    // Tifinagh to Talatint
    if (tifinaghInput && talatintOutput) {
        tifinaghInput.addEventListener('input', () => { // *** CHANGED to 'input' event ***
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        });
    }

    // Latin to Tifinagh
    if (latinInput && tifinaghLatinOutput) {
        latinInput.addEventListener('input', () => { // *** CHANGED to 'input' event ***
            const latinText = latinInput.value;
            tifinaghLatinOutput.value = convertLatinToTifinagh(latinText);
        });
    }

    // --- REMOVED: Old button click listeners ---
    // Since we want immediate conversion, the buttons are no longer needed to trigger the main conversion.
    // They are commented out in index.html too.

    // --- REMOVED: Dark Mode Toggle Logic from here ---
    // This logic now belongs solely in themeToggle.js
}); // End of DOMContentLoaded

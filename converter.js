// converter.js

// Ensure all DOM operations happen after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get DOM Elements (UPDATED IDs to match index.html) ---
    // Tifinagh to Talatint (Old Latin)
    const tifinaghInput = document.getElementById('tifinaghInputMain');
    const talatintOutput = document.getElementById('talatintOutput');

    // Latin to Tifinagh
    const latinInput = document.getElementById('latinInputMain');
    const tifinaghLatinOutput = document.getElementById('tifinaghLatinOutput');
    // NEW: Output for Talatint with extended Latin characters
    const extendedTalatintOutput = document.getElementById('extendedTalatintOutput');

    // --- Error Checking for essential elements ---
    if (!tifinaghInput || !talatintOutput || !latinInput || !tifinaghLatinOutput || !extendedTalatintOutput) {
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

    // NEW: Map standard Latin input (e.g., 'gh') to extended Talatint characters (e.g., 'ɣ')
    const latinToExtendedTalatintMap = {
        'ch': 'č', // or 'č'
        'ḍ': 'ḍ', // This is already extended, but for consistency if input allows 'd' then 'ḍ'
        'gh': 'ɣ',
        'ḥ': 'ḥ',
        'kh': 'x', // or 'χ'
        'ph': 'f',
        'q': 'q',
        'sh': 'š', // or 'š'
        'ṣ': 'ṣ',
        'ţ': 'ṭ',
        'ṭ': 'ṭ',
        'th': 'ţ', // or 'þ'
        'zh': 'ž', // or 'ž'
        'ẓ': 'ẓ',
        'ts': 'ts',
        'dz': 'dz',

        // Single characters that might have an extended variant or are already fine
        'a': 'a', 'b': 'b', 'c': 'k', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g',
        'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
        'o': 'o', 'p': 'p', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v',
        'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
        'ɛ': 'ɛ', // Assuming 'ɛ' is mapped

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
        talatintText = talatintText.replace(/j/g, 'i'); // As per your original rule
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
                tifinaghResult += lowerCaseLatinText[i];
                i++;
            }
        }
        return tifinaghResult;
    }

    /**
     * NEW: Converts standard Latin text (e.g., 'gh') to Talatint with extended Latin characters (e.g., 'ɣ').
     * @param {string} latinText - The input text in standard Latin script.
     * @returns {string} The converted text in extended Talatint.
     */
    function convertLatinToExtendedTalatint(latinText) {
        let extendedTalatintResult = '';
        let lowerCaseLatinText = latinText.toLowerCase();
        let i = 0;

        // Sort keys by length in descending order to handle digraphs before single characters
        const sortedKeys = Object.keys(latinToExtendedTalatintMap).sort((a, b) => b.length - a.length);

        while (i < lowerCaseLatinText.length) {
            let converted = false;

            for (const key of sortedKeys) {
                if (lowerCaseLatinText.substring(i, i + key.length) === key) {
                    extendedTalatintResult += latinToExtendedTalatintMap[key];
                    i += key.length;
                    converted = true;
                    break;
                }
            }

            if (!converted) {
                extendedTalatintResult += lowerCaseLatinText[i];
                i++;
            }
        }
        return extendedTalatintResult;
    }


    // --- Event Listeners for Immediate Conversion (Physical Keyboard Input on index.html) ---

    // Tifinagh to Talatint
    if (tifinaghInput && talatintOutput) {
        tifinaghInput.addEventListener('input', () => {
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        });
    }

    // Latin to Tifinagh AND NEW Extended Talatint
    if (latinInput && tifinaghLatinOutput && extendedTalatintOutput) {
        latinInput.addEventListener('input', () => {
            const latinText = latinInput.value;
            tifinaghLatinOutput.value = convertLatinToTifinagh(latinText);
            extendedTalatintOutput.value = convertLatinToExtendedTalatint(latinText); // NEW conversion
        });
    }

}); // End of DOMContentLoaded

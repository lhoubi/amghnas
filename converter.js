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
    // This map generally produces standard Latin, which then gets further processed for Talatint.
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
    // This map prioritizes longest matches for accurate digraph conversion
    const standardLatinToTifinaghMap = {
        // Digraphs and Special Characters (must come before single letters if they share a prefix)
        'ch': 'ⵛ', 'ḍ': 'ⴹ', 'gh': 'ⵖ', 'ḥ': 'ⵃ', 'kh': 'ⵅ', 'ph': 'ⴼ', 'q': 'ⵇ',
        'sh': 'ⵛ', 'ṣ': 'ⵚ', 'ţ': 'ⵟ', 'ṭ': 'ⵟ', 'th': 'ⵝ', 'zh': 'ⵥ', 'ẓ': 'ⵥ',
        'ts': 'ⵜⵙ', 'dz': 'ⴷⵣ',
        'ɛ': 'ⵄ', // Assuming 'ɛ' is mapped

        // Single Latin characters
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⴽ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ', 'g': 'ⴳ',
        'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
        'o': 'ⵓ', 'p': 'ⵒ', 'r': 'ⵔ', 's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ',
        'w': 'ⵡ', 'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',

        ' ': ' ',
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-',
    };


    // NEW: Map standard Latin input (e.g., 'gh', 'dh') to extended Talatint characters (e.g., 'ɣ', 'ḍ')
    // This map is crucial for the extended Talatint output.
    const latinToExtendedTalatintMap = {
        // --- Emphatic Consonants / Digraphs mapping to extended Latin characters ---
        // Prioritize multi-character sequences for correct parsing.
        // These conventions can be adjusted based on your preferred transliteration system.
        'ch': 'č',     // Tifinagh ⵞ
        'gh': 'ɣ',     // Tifinagh ⵖ
        'kh': 'x',     // Tifinagh ⵅ (or χ if preferred)
        'sh': 'š',     // Tifinagh ⵛ (or š if preferred)

        // Common digraph conventions for dotted letters
        'ⴹ': 'ḍ',     // For emphatic D (Tifinagh ⴹ)
        'ⵟ': 'ṭ',     // For emphatic T (Tifinagh ⵟ)
        'ⵕ': 'ṛ',     // For emphatic R (Tifinagh ⵕ)
        'ⵚ': 'ṣ',     // Common for emphatic S (Tifinagh ⵚ), used 'sx' to avoid conflict with 'sh'
        'ⵃ': 'ḥ',     // For emphatic H (Tifinagh ⵃ)
        'ⵥ': 'ẓ',     // For emphatic Z (Tifinagh ⵥ)

        // If the user types the dotted character directly, preserve it
        'ḍ': 'ḍ', 'ḥ': 'ḥ', 'ṛ': 'ṛ', 'ṣ': 'ṣ', 'ṭ': 'ṭ',
        'ž': 'ž', 'ẓ': 'ẓ', 'č': 'č', 'š': 'š', 'ɣ': 'ɣ', 'ɛ': 'ɛ',

        // --- Basic Latin characters (fallback if no special mapping) ---
        // Ensure single characters are after their digraph counterparts if they share a letter.
        // For example, 'd' comes after 'dh'.
        'a': 'a', 'b': 'b', 'c': 'k', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g',
        'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
        'o': 'o', 'p': 'p', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v',
        'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',

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
            .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics that might have come from Tifinagh map (e.g. if 'ḍ' became 'd' + diacritic)

        return talatintText;
    }

    /**
     * Converts Latin text to Tifinagh script.
     * This uses the `standardLatinToTifinaghMap`.
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

    /**
     * NEW: Converts standard Latin text (e.g., 'gh', 'dh') to Talatint with extended Latin characters (e.g., 'ɣ', 'ḍ').
     * This uses the `latinToExtendedTalatintMap`.
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
                // If no mapping, just append the original character
                extendedTalatintResult += lowerCaseLatinText[i];
                i++;
            }
        }
        return extendedTalatintResult;
    }


    // --- Event Listeners for Immediate Conversion ---

    // Tifinagh to Talatint conversion
    if (tifinaghInput && talatintOutput) {
        tifinaghInput.addEventListener('input', () => {
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        });
    }

    // Latin to Tifinagh AND NEW Extended Talatint conversion
    if (latinInput && tifinaghLatinOutput && extendedTalatintOutput) {
        latinInput.addEventListener('input', () => {
            const latinText = latinInput.value;
            tifinaghLatinOutput.value = convertLatinToTifinagh(latinText);
            extendedTalatintOutput.value = convertLatinToExtendedTalatint(latinText); // NEW conversion
        });
    }

}); // End of DOMContentLoaded

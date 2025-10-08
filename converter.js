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
    // Output for Talatint with extended Latin characters
    const extendedTalatintOutput = document.getElementById('extendedTalatintOutput');

    // --- Error Checking for essential elements ---
    if (!tifinaghInput || !talatintOutput || !latinInput || !tifinaghLatinOutput || !extendedTalatintOutput) {
        console.error("Error: One or more essential input/output elements not found in index.html for converter.js. Conversion will not work.");
        return; // Exit if essential elements are missing
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

    // Map Latin input (both lowercase and uppercase for emphatics) to Tifinagh
    const latinToTifinaghMap = {
        // --- Emphatic Capital Letters (prioritized) ---
        'D': 'ⴹ', // Capital D -> Emphatic D
        'H': 'ⵃ', // Capital H -> Emphatic H
        'R': 'ⵕ', // Capital R -> Emphatic R
        'S': 'ⵚ', // Capital S -> Emphatic S
        'T': 'ⵟ', // Capital T -> Emphatic T
        'Z': 'ⵥ', // Capital Z -> Emphatic Z
        'G': 'ⵖ', // Capital G -> Gamma (ɣ)
        'C': 'ⵛ', // Capital C -> Ch (š)
        'K': 'ⵅ', // Capital K -> Kh (x)

        // --- Digraphs and Special Characters (must come before single letters if they share a prefix)
        'ch': 'ⵛ', 'ḍ': 'ⴹ', 'gh': 'ⵖ', 'ḥ': 'ⵃ', 'kh': 'ⵅ', 'ph': 'ⴼ', 'q': 'ⵇ',
        'sh': 'ⵛ', 'ṣ': 'ⵚ', 'ţ': 'ⵟ', 'ṭ': 'ⵟ', 'th': 'ⵝ', 'zh': 'ⵥ', 'ẓ': 'ⵥ',
        'ts': 'ⵜⵙ', '        dz': 'ⴷⵣ', // Corrected '        dz' to 'dz'
        'ɛ': 'ⵄ',

        // --- Single Latin characters (lowercase) ---
        'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⴽ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ', 'g': 'ⴳ',
        'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
        'o': 'ⵓ', 'p': 'ⵒ', 'r': 'ⵔ', 's': 'ⵙ', 't': 'ⵜ', 'u': 'ⵓ', 'v': 'ⵠ',
        'w': 'ⵡ', 'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ',

        ' ': ' ',
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-',
    };


    // Map Latin input (both lowercase and uppercase for emphatics/special chars) to Extended Talatint characters
    const latinToExtendedTalatintMap = {
        // --- Emphatic Capital Letters (prioritized) ---
        'D': 'ḍ', // Capital D -> Emphatic D (Talatint)
        'H': 'ḥ', // Capital H -> Emphatic H (Talatint)
        'R': 'ṛ', // Capital R -> Emphatic R (Talatint)
        'S': 'ṣ', // Capital S -> Emphatic S (Talatint)
        'T': 'ṭ', // Capital T -> Emphatic T (Talatint)
        'Z': 'ẓ', // Capital Z -> Emphatic Z (Talatint)
        'G': 'ɣ', // Capital G -> Gamma (Talatint)
        'C': 'č', // Capital C -> Ch (Talatint)
        'K': 'x', // Capital K -> Kh (Talatint)

        // --- Digraphs and common input patterns (must come before single characters) ---
        'sh': 'š',     // Tifinagh ⵛ (or š if preferred)
        'ch': 'č',     // Tifinagh ⵞ
        'gh': 'ɣ',     // Tifinagh ⵖ
        'kh': 'x',     // Tifinagh ⵅ (or χ if preferred)

        // If you still want ASCII digraphs for emphatic, they go here AFTER the capitals
        'dh': 'ḍ',
        'th': 'ṭ',
        'rh': 'ṛ',
        'sx': 'ṣ',
        'hh': 'ḥ',
        'zh': 'ẓ',


        // --- Direct mappings for already extended Latin characters (preserves them) ---
        'ḍ': 'ḍ', 'ḥ': 'ḥ', 'ṛ': 'ṛ', 'ṣ': 'ṣ', 'ṭ': 'ṭ',
        'ž': 'ž', 'ẓ': 'ẓ', 'č': 'č', 'š': 'š', 'ɣ': 'ɣ', 'ɛ': 'ɛ',
        'x': 'x', // Make sure 'x' (for Kh) is explicitly mapped to itself if not part of a digraph

        // --- Basic Latin characters (lowercase fallback) ---
        'a': 'a', 'b': 'b', 'c': 'k', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g',
        'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
        'o': 'o', 'p': 'p', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v',
        'w': 'w', 'y': 'y', 'z': 'z',

        ' ': ' ',
        '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-',
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
        extendedTalatintResult = extendedTalatintResult.replace(/j/g, 'i'); // As per your original rule

        // No diacritic stripping here, to preserve 'ḍ', 'ṭ', etc.
        return extendedTalatintResult;
    }

    /**
     * Converts Latin text to Tifinagh script.
     * This uses the `latinToTifinaghMap`.
     * @param {string} latinText - The input text in Latin script.
     * @returns {string} The converted text in Tifinagh.
     */
    function convertLatinToTifinagh(latinText) {
        let tifinaghResult = '';
        let i = 0;

        // Sort keys by length in descending order to handle digraphs/capitals before single characters
        const sortedKeys = Object.keys(latinToTifinaghMap).sort((a, b) => b.length - a.length);

        while (i < latinText.length) { // *** Do NOT toLowerCase() here ***
            let converted = false;

            for (const key of sortedKeys) {
                // Compare with the original latinText, case-sensitively first for capitals
                if (latinText.substring(i, i + key.length) === key) {
                    tifinaghResult += latinToTifinaghMap[key];
                    i += key.length;
                    converted = true;
                    break;
                }
            }

            if (!converted) {
                // If no direct mapping, try a lowercase match for basic letters
                let lowerChar = latinText[i].toLowerCase();
                // This logic needs to be careful not to override explicit capital mappings
                // A simpler approach for general non-mapped characters:
                if (latinToTifinaghMap[lowerChar]) {
                     tifinaghResult += latinToTifinaghMap[lowerChar];
                     i++;
                } else {
                     tifinaghResult += latinText[i]; // Append as-is if no mapping
                     i++;
                }
            }
        }
        return tifinaghResult;
    }

    /**
     * Converts standard Latin text (e.g., 'gh', 'D') to Talatint with extended Latin characters (e.g., 'ɣ', 'ḍ').
     * @param {string} latinText - The input text in standard Latin script.
     * @returns {string} The converted text in extended Talatint.
     */
    function convertLatinToExtendedTalatint(latinText) {
        let extendedTalatintResult = '';
        let i = 0;

        // Sort keys by length in descending order to handle digraphs/capitals before single characters
        const sortedKeys = Object.keys(latinToExtendedTalatintMap).sort((a, b) => b.length - a.length);

        while (i < latinText.length) { // *** Do NOT toLowerCase() here ***
            let converted = false;

            for (const key of sortedKeys) {
                // Compare with the original latinText, case-sensitively first for capitals
                if (latinText.substring(i, i + key.length) === key) {
                    extendedTalatintResult += latinToExtendedTalatintMap[key];
                    i += key.length;
                    converted = true;
                    break;
                }
            }

            if (!converted) {
                // If no direct mapping (e.g., an unmapped symbol or number), append as-is.
                // For basic Latin letters, we can fall back to their lowercase mapping if it exists.
                let lowerChar = latinText[i].toLowerCase();
                if (latinToExtendedTalatintMap[lowerChar]) {
                     extendedTalatintResult += latinToExtendedTalatintMap[lowerChar];
                     i++;
                } else {
                     extendedTalatintResult += latinText[i]; // Append as-is if no mapping
                     i++;
                }
            }
        }
        return extendedTalatintResult;
    }


    // --- Event Listeners for Immediate Conversion ---

    // Tifinagh to Talatint conversion (unchanged, still uses tifinaghToExtendedTalatintMap)
    if (tifinaghInput && talatintOutput) {
        tifinaghInput.addEventListener('input', () => {
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        });
    }

    // Latin to Tifinagh AND Extended Talatint conversion
    if (latinInput && tifinaghLatinOutput && extendedTalatintOutput) {
        latinInput.addEventListener('input', () => {
            const latinText = latinInput.value;
            tifinaghLatinOutput.value = convertLatinToTifinagh(latinText);
            extendedTalatintOutput.value = convertLatinToExtendedTalatint(latinText);
        });
    }

}); // End of DOMContentLoaded

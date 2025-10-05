// Converter.js

// --- Get DOM Elements ---
// Tifinagh to Talatint (Old Latin)
const tifinaghInput = document.getElementById('tifinaghInput');
const convertToTalatintBtn = document.getElementById('convertToTalatintBtn');
const talatintOutput = document.getElementById('talatintOutput');

// Latin to Tifinagh
const latinInput = document.getElementById('latinInput');
const convertToTifinaghBtn = document.getElementById('convertToTifinaghBtn');
const tifinaghLatinOutput = document.getElementById('tifinaghLatinOutput');

// Dark Mode Toggle Button (NEW)
const themeToggleBtn = document.getElementById('themeToggle');


// --- Mapping Definitions ---

// Map Tifinagh characters to a standard Latin transliteration
const tifinaghToStandardLatinMap = {
    'ⴰ': 'a', 'ⴱ': 'b', 'ⴳ':'g', 'ⴷ': 'd', 'ⴹ': 'ḍ', 'ⴻ': 'e', 'ⴼ': 'f',
    'ⴽ': 'k', 'ⵀ': 'h', 'ⵃ': 'ḥ', 'ⵄ': 'ɛ', 'ⵅ': 'x', 'ⵇ': 'q', 'ⵉ': 'i',
    'ⵊ': 'j', 'ⵍ':'l', 'ⵎ': 'm', 'ⵏ': 'n', 'ⵠ':'v', 'ⵓ':'u', 'ⵔ':'r',
    'ⵕ': 'ṛ', 'ⵖ':'ɣ', 'ⵙ':'s', 'ⵚ':'ṣ', 'ⵛ': 'sh', 'ⵜ': 't', 'ⵟ': 'ṭ',
    'ⵝ': 'th', 'ⵞ': 'ch', 'ⵡ': 'w', 'ⵢ': 'y', 'ⵣ': 'z', 'ⵥ': 'ẓ','ⵒ':'p',
    ' ': ' ', // Space
    '.': '.', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?', '-': '-', // Punctuation
};

// Map standard Latin letters (and common digraphs) to Tifinagh
const standardLatinToTifinaghMap = {
    'ch': 'ⵛ', 'ḍ': 'ⴹ', 'gh': 'ⵖ', 'ḥ': 'ⵃ', 'kh': 'ⵅ', 'ph': 'ⴼ', 'q': 'ⵇ',
    'sh': 'ⵛ', 'ṣ': 'ⵚ', 'ţ': 'ⵟ', 'ṭ': 'ⵟ', 'th': 'ⵝ', 'zh': 'ⵥ', 'ẓ': 'ⵥ',
    'ts': 'ⵜⵙ', 'dz': 'ⴷⵣ',

    'a': 'ⴰ', 'b': 'ⴱ', 'c': 'ⴽ', 'd': 'ⴷ', 'e': 'ⴻ', 'f': 'ⴼ', 'g': 'ⴳ',
    'h': 'ⵀ', 'i': 'ⵉ', 'j': 'ⵊ', 'k': 'ⴽ', 'l': 'ⵍ', 'm': 'ⵎ', 'n': 'ⵏ',
    'o': 'ⵓ', 'p': 'ⵒ', 'r': 'ⵔ', 's': 'ⵙ', 't': 'ⵜ', 'u':'ⵓ' ,'v': 'ⵠ',
    'w': 'ⵡ', 'x': 'ⵅ', 'y': 'ⵢ', 'z': 'ⵣ', 'ɛ': 'ⵄ',
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

    // Changed for minuscule output
    let talatintText = standardLatinTransliteration.toLowerCase(); // Ensure lowercase

    // Rule 2: 'ⵓ' for 'u' (lowercase)
    talatintText = talatintText.replace(/u/g, 'u');

    // Rule 3: 'i' for 'j' (lowercase)
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

    while (i < lowerCaseLatinText.length) {
        let converted = false;
        const sortedKeys = Object.keys(standardLatinToTifinaghMap).sort((a, b) => b.length - a.length);

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


// --- Event Listeners ---

// For Tifinagh to Talatint conversion
if (convertToTalatintBtn) {
    convertToTalatintBtn.addEventListener('click', () => {
        if (tifinaghInput && talatintOutput) {
            const tifinaghText = tifinaghInput.value;
            talatintOutput.value = convertTifinaghToTalatint(tifinaghText);
        } else {
            console.error("JS Error: Tifinagh to Talatint input/output elements not found.");
        }
    });
} else {
    console.error("JS Error: 'Convert to Talatint' button not found.");
}

// For Latin to Tifinagh conversion
if (convertToTifinaghBtn) {
    convertToTifinaghBtn.addEventListener('click', () => {
        if (latinInput && tifinaghLatinOutput) {
            const latinText = latinInput.value;
            tifinaghLatinOutput.value = convertLatinToTifinagh(latinText);
        } else {
            console.error("JS Error: Latin to Tifinagh input/output elements not found.");
        }
    });
} else {
    console.error("JS Error: 'Convert to Tifinagh' button not found.");
}


// --- Dark Mode Toggle Logic (NEW) ---
if (themeToggleBtn) {
    console.log("Dark Mode Toggle Button found.");
    themeToggleBtn.addEventListener('click', () => {
        console.log("Dark Mode Toggle Button clicked!");
        document.body.classList.toggle('dark-mode');

        // Update button icon based on theme
        const icon = themeToggleBtn.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Toggle Light Mode'; // Change text as well
        } else {
            localStorage.setItem('theme', 'light');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Toggle Dark Mode'; // Change text as well
        }
        console.log("Current theme:", localStorage.getItem('theme'));
    });

    // Load user preference when page loads
    const savedTheme = localStorage.getItem('theme');
    console.log("Loaded theme from localStorage:", savedTheme);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        // Also update the button icon/text immediately on load if dark mode is active
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Toggle Light Mode';
    }
} else {
    console.error("JS Error: Theme Toggle button with ID 'themeToggle' not found in the DOM.");
}
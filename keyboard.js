document.addEventListener('DOMContentLoaded', () => {
    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (!keyboardInput) {
        console.error("Error: 'keyboardInput' div not found. Please ensure your HTML has <div id='keyboardInput' contenteditable='true'>.");
        return;
    }

    // --- Tifinagh Mapping ---
    // This map defines the Latin-to-Tifinagh conversions.
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

    // --- Shifted/Capitalized Tifinagh Mapping ---
    const tifinaghShiftMap = {
        'A': 'ⵄ', 'G': 'ⵖ', 'H': 'ⵃ', 'D': 'ⴹ', 'T': 'ⵟ', 'R': 'ⵕ',
        'S': 'ⵚ', 'Z': 'ⵥ', 'X': 'ⵅ', 'C': 'ⵛ', 'Q': 'ⵇ', 'W': 'ⵯ',
    };

    // --- Digraph Map (Longest matches first) ---
    // These need to be processed carefully to ensure correct conversion.
    const digraphMap = {
        'gh': 'ⵖ', 'kh': 'ⵅ', 'ch': 'ⵛ', 'sh': 'ⵛ',
        'dh': 'ⴹ', 'th': 'ⵜ', 'ts': 'ⵚ',
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

    // --- Selection/Cursor Management for contenteditable div ---
    // These are crucial for maintaining the cursor position after content updates.
    let savedRange;

    function saveSelection() {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                savedRange = sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            savedRange = document.selection.createRange();
        }
    }

    function restoreSelection() {
        if (savedRange) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(savedRange);
            } else if (document.selection && savedRange.select) {
                savedRange.select();
            }
        }
    }

    // Helper to get caret position in contenteditable div
    function getCaretCharacterOffset(element) {
        let caretOffset = 0;
        const doc = element.ownerDocument || element.document;
        const win = doc.defaultView || doc.parentWindow;
        let sel;
        if (typeof win.getSelection != "undefined") {
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                const range = win.getSelection().getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }
        } else if ((sel = doc.selection) && sel.type != "Control") {
            const textRange = sel.createRange();
            const preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        return caretOffset;
    }

    // Helper to set caret position in contenteditable div
    function setCaretPosition(element, offset) {
        const range = document.createRange();
        const sel = window.getSelection();
        let currentOffset = 0;

        function findNodeAndOffset(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (offset <= currentOffset + node.length) {
                    range.setStart(node, offset - currentOffset);
                    range.collapse(true);
                    return true;
                }
                currentOffset += node.length;
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    if (findNodeAndOffset(node.childNodes[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        if (findNodeAndOffset(element)) {
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            // Fallback: set cursor to the end
            range.selectNodeContents(element);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }


    // --- Core Conversion Function (Latin to Tifinagh) ---
    function convertLatinToTifinagh(latinText) {
        let tifinaghResult = '';
        let i = 0;
        while (i < latinText.length) {
            let foundMapping = false;

            // Try to match digraphs first (longest matches first)
            for (const digraph in digraphMap) {
                if (latinText.substring(i, i + digraph.length).toLowerCase() === digraph) {
                    tifinaghResult += digraphMap[digraph];
                    i += digraph.length;
                    foundMapping = true;
                    break;
                }
            }

            if (!foundMapping) {
                // If no digraph, try single character mapping
                const char = latinText[i];
                let mappedChar = combinedTifinaghMap[char]; // Check for case-sensitive first (e.g., 'A' for shifted)
                if (!mappedChar) { // If no case-sensitive match, try lowercase
                    mappedChar = combinedTifinaghMap[char.toLowerCase()];
                }

                if (mappedChar) {
                    tifinaghResult += mappedChar;
                } else {
                    // If no Tifinagh mapping, keep the original character (e.g., numbers, punctuation)
                    tifinaghResult += char;
                }
                i++;
            }
        }
        return tifinaghResult;
    }

    // --- Main Input Processing Function ---
    // This function will be called by the MutationObserver.
    let isProcessingInput = false; // Flag to prevent infinite loops

    function processInput() {
        if (isProcessingInput) return; // Prevent re-entry

        isProcessingInput = true;
        
        const originalLatinText = keyboardInput.textContent;
        const currentCaretPos = getCaretCharacterOffset(keyboardInput);

        const convertedTifinaghText = convertLatinToTifinagh(originalLatinText);

        // Update the div's content if there's a change
        if (keyboardInput.textContent !== convertedTifinaghText) {
            keyboardInput.textContent = convertedTifinaghText;

            // Recalculate new caret position based on conversion.
            // This is the trickiest part for contenteditable.
            // We assume that the conversion up to the original caret position
            // determines the new caret position.
            const prefixLatin = originalLatinText.substring(0, currentCaretPos);
            const prefixTifinagh = convertLatinToTifinagh(prefixLatin);
            const newCaretPos = prefixTifinagh.length;

            setCaretPosition(keyboardInput, newCaretPos);
        }
        isProcessingInput = false;
    }

    // --- MutationObserver Setup ---
    const observer = new MutationObserver((mutations) => {
        // Disconnect observer temporarily to prevent infinite loop when we modify content
        observer.disconnect();
        processInput();
        // Reconnect observer after processing
        observer.observe(keyboardInput, observerConfig);
    });

    const observerConfig = {
        childList: true, // Observe direct children changes
        subtree: true,   // Observe all descendants
        characterData: true, // Observe text changes within text nodes
        characterDataOldValue: true // Get old value for character data
    };
    observer.observe(keyboardInput, observerConfig);


    // --- Virtual Keyboard Key Clicks ---
    keyboardKeys.forEach(key => {
        key.addEventListener('click', (event) => {
            event.preventDefault();

            const keyValue = key.dataset.key;
            saveSelection(); // Save cursor position before modification

            let currentText = keyboardInput.textContent;
            let newText = currentText;

            if (keyValue === 'backspace') {
                const sel = window.getSelection();
                if (!sel.isCollapsed) { // If text is selected, delete it
                    sel.deleteFromDocument();
                } else { // No selection, delete character before cursor
                    const range = sel.getRangeAt(0);
                    if (range.startOffset > 0) {
                        range.setStart(range.startContainer, range.startOffset - 1);
                        range.deleteContents();
                    }
                }
                highlightKey('backspace');
            } else {
                // Insert text at the current cursor position
                document.execCommand('insertText', false, keyValue);
                highlightKey(keyValue);
            }
            // After direct manipulation or insertion, let the MutationObserver handle conversion
            keyboardInput.focus();
        });
    });

    // --- Physical Keyboard Keydown (for Backspace and Enter) ---
    keyboardInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            highlightKey('backspace');
            // The MutationObserver will handle the text content change
        } else if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default new line behavior if contenteditable is too complex
            document.execCommand('insertHTML', false, '<br>'); // Insert a <br> for newline
            highlightKey('\n');
            // MutationObserver will process the text change (newline character)
        }
        // For other character keys, let the browser insert them (Latin),
        // and the MutationObserver will then convert them to Tifinagh.
        // No e.preventDefault() here for character keys unless absolutely necessary
        // to avoid interfering with native mobile input methods.
    });


    // --- Action Buttons: Copy and Clear ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // Select all content in the contenteditable div
            const range = document.createRange();
            range.selectNodeContents(keyboardInput);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(keyboardInput.textContent)
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
                document.execCommand('copy'); // Fallback for older browsers
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 1500);
            }
            selection.removeAllRanges(); // Deselect after copying
            keyboardInput.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.textContent = '';
            keyboardInput.focus();
            // No explicit 'input' event needed here as MutationObserver will pick up the change
            // and processInput will convert empty string to empty string.
        });
    }

    // --- Optional: Visual Cue for Input Focus ---
    keyboardInput.addEventListener('focus', () => {
        keyboardInput.classList.add('focused');
    });
    keyboardInput.addEventListener('blur', () => {
        keyboardInput.classList.remove('focused');
    });
});

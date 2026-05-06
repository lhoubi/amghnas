document.addEventListener('DOMContentLoaded', () => {

    const keyboardInput = document.getElementById('keyboardInput');
    const keyboardKeys  = document.querySelectorAll('.keyboard-key');
    const copyBtn       = document.getElementById('copyBtn');
    const clearBtn      = document.getElementById('clearBtn');
    const themeToggle   = document.getElementById('themeToggle');
    const moonIcon      = document.querySelector('.moon-icon');
    const sunIcon       = document.querySelector('.sun-icon');

    if (!keyboardInput) {
        console.error('ERROR: keyboardInput not found');
        return;
    }

    // ─── THEME ───────────────────────────────────────────────────────────────
    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon)  sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon)  sunIcon.classList.add('hidden');
        }
    }
    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(isDarkMode);
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            applyTheme(isDarkMode);
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }

    // ─── KEY MAP ─────────────────────────────────────────────────────────────
    // Digraphs MUST come before single chars (sorted by length below)
    const keyMap = {
        // Digraphs
        'gh':'ⵖ', 'kh':'ⵅ', 'ch':'ⵛ', 'sh':'ⵛ', 'dh':'ⴹ', 'ts':'ⵚ', 'gl':'ⴳⵍ',
        'لا':'ⵍⴰ',
        // Lowercase Latin
        'a':'ⴰ','b':'ⴱ','c':'ⵛ','d':'ⴷ','e':'ⴻ','f':'ⴼ',
        'g':'ⴳ','h':'ⵀ','i':'ⵉ','j':'ⵊ','k':'ⴽ','l':'ⵍ',
        'm':'ⵎ','n':'ⵏ','o':'ⵓ','p':'ⵒ','q':'ⵇ','r':'ⵔ',
        's':'ⵙ','t':'ⵜ','u':'ⵓ','v':'ⵠ','w':'ⵡ',
        'x':'ⵅ','y':'ⵢ','z':'ⵣ',
        // Emphatic uppercase (SHIFT key)
        'A':'ⵄ','D':'ⴹ','G':'ⵖ','H':'ⵃ','R':'ⵕ','S':'ⵚ','T':'ⵟ','W':'ⵯ','Z':'ⵥ',
        // Arabic
        'ا':'ⴰ','أ':'ⴰ','آ':'ⴰ','إ':'ⵉ',
        'ب':'ⴱ','ت':'ⵜ','ث':'ⵜ',
        'ج':'ⵊ','ح':'ⵃ','خ':'ⵅ',
        'د':'ⴷ','ذ':'ⴷ',
        'ر':'ⵔ','ز':'ⵣ',
        'س':'ⵙ','ش':'ⵛ','ص':'ⵚ','ض':'ⴹ',
        'ط':'ⵟ','ظ':'ⴹ',
        'ع':'ⵄ','غ':'ⵖ',
        'ف':'ⴼ','ق':'ⵇ','ك':'ⴽ',
        'ل':'ⵍ','م':'ⵎ','ن':'ⵏ',
        'ه':'ⵀ','و':'ⵡ','ي':'ⵢ',
        'ى':'ⵉ','ؤ':'ⵓ','ئ':'ⵉ',
        'ڤ':'ⵠ','ڭ':'ⴳ','ـ':'ⵯ',
        ' ':' ',
        // ة → intentionally omitted (produces nothing)
    };

    // Pre-sorted keys: longest first (ensures digraphs always checked before singles)
    const SORTED_KEYS = Object.keys(keyMap).sort((a, b) => b.length - a.length);

    // Arabic tashkeel range
    const TASHKEEL = /[\u064B-\u065F\u0670]/g;

    function isTifinagh(ch) {
        const cp = ch.codePointAt(0);
        return cp >= 0x2D30 && cp <= 0x2D7F;
    }

    // Convert any string to Tifinagh, preserving already-Tifinagh chars
    function toTifinagh(str) {
        str = str.replace(TASHKEEL, '');
        let out = '', i = 0;
        while (i < str.length) {
            const ch = str[i];
            // Already Tifinagh → keep
            if (isTifinagh(ch)) { out += ch; i++; continue; }
            // Space / passthrough punctuation
            if (ch === ' ' || ch === '\n') { out += ch; i++; continue; }
            // Try longest match first
            let matched = false;
            for (const k of SORTED_KEYS) {
                if (str.substr(i, k.length) === k) {
                    out += keyMap[k]; // may be '' for blocked chars
                    i += k.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) { i++; } // skip unmapped chars silently
        }
        return out;
    }

    // ─── CURSOR-AWARE INSERT ──────────────────────────────────────────────────
    // Inserts `text` at current selection position (works anywhere in the textarea)
    function insertAtCursor(text) {
        if (text === undefined || text === null) return;
        const start = keyboardInput.selectionStart;
        const end   = keyboardInput.selectionEnd;
        const val   = keyboardInput.value;
        keyboardInput.value = val.substring(0, start) + text + val.substring(end);
        const newPos = start + text.length;
        keyboardInput.selectionStart = keyboardInput.selectionEnd = newPos;
        keyboardInput.focus();
    }

    function deleteChar(forward) {
        const start = keyboardInput.selectionStart;
        const end   = keyboardInput.selectionEnd;
        const val   = keyboardInput.value;
        if (start !== end) {
            // Delete selection
            keyboardInput.value = val.substring(0, start) + val.substring(end);
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
        } else if (!forward && start > 0) {
            keyboardInput.value = val.substring(0, start - 1) + val.substring(start);
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start - 1;
        } else if (forward && end < val.length) {
            keyboardInput.value = val.substring(0, start) + val.substring(end + 1);
            keyboardInput.selectionStart = keyboardInput.selectionEnd = start;
        }
        keyboardInput.focus();
    }

    // ─── VIRTUAL KEY CLICKS ───────────────────────────────────────────────────
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            const v = key.dataset.key;
            if      (v === 'backspace') deleteChar(false);
            else if (v === 'Delete')    deleteChar(true);
            else                        insertAtCursor(v); // already Tifinagh
            applyClickEffect(key);
        });
    });

    // ─── PHYSICAL KEYBOARD (keydown) ─────────────────────────────────────────
    // This is the PRIMARY handler for desktop. It intercepts every keystroke
    // BEFORE the browser inserts anything, converts it, and inserts Tifinagh.
    // Because we call e.preventDefault() the browser never writes the raw key —
    // so editing in the middle of text works perfectly.
    document.addEventListener('keydown', (e) => {
        if (document.activeElement !== keyboardInput) return;

        // Always allow: browser shortcuts, navigation keys
        if (e.ctrlKey || e.metaKey) return;
        const NAV = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
                     'Home','End','PageUp','PageDown','Tab','Escape',
                     'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'];
        if (NAV.includes(e.key)) return;

        const key = e.key;

        // Backspace / Delete
        if (key === 'Backspace') {
            e.preventDefault();
            deleteChar(false);
            const btn = document.querySelector('.keyboard-key.delete[data-key="backspace"]');
            if (btn) applyClickEffect(btn);
            return;
        }
        if (key === 'Delete') {
            e.preventDefault();
            deleteChar(true);
            return;
        }

        // Space
        if (key === ' ') {
            e.preventDefault();
            insertAtCursor(' ');
            const sp = document.querySelector('.keyboard-key.wide[data-key=" "]');
            if (sp) applyClickEffect(sp);
            return;
        }

        // Enter → allow (line break)
        if (key === 'Enter') return;

        // ة → block, produce nothing
        if (key === 'ة') { e.preventDefault(); return; }

        // Only handle single printable characters beyond here
        if (key.length !== 1) { e.preventDefault(); return; }

        // ── Digraph check ──
        // If the character just before the cursor + this new key forms a digraph,
        // remove the previous character and insert the digraph result instead.
        const pos    = keyboardInput.selectionStart;
        const selEnd = keyboardInput.selectionEnd;
        if (pos === selEnd && pos > 0) {
            const prevChar = keyboardInput.value[pos - 1];
            const digraph  = (prevChar + key).toLowerCase();
            if (keyMap[digraph]) {
                e.preventDefault();
                const val = keyboardInput.value;
                keyboardInput.value = val.substring(0, pos - 1) + keyMap[digraph] + val.substring(pos);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = pos - 1 + keyMap[digraph].length;
                keyboardInput.focus();
                const vk = document.querySelector(`.keyboard-key[data-key="${keyMap[digraph]}"]`);
                if (vk) applyClickEffect(vk);
                return;
            }
        }

        // ── Single char lookup ──
        // Emphatic uppercase first (A D G H R S T W Z)
        let tif = keyMap[key];

        // Non-emphatic uppercase → use lowercase Tifinagh
        if (tif === undefined && key >= 'A' && key <= 'Z') {
            tif = keyMap[key.toLowerCase()];
        }

        // Arabic tashkeel → block silently
        if (/[\u064B-\u065F\u0670]/.test(key)) { e.preventDefault(); return; }

        if (tif !== undefined) {
            e.preventDefault();
            insertAtCursor(tif); // tif may be '' (blocked chars like ة)
            if (tif) {
                const vk = document.querySelector(`.keyboard-key[data-key="${tif}"]`);
                if (vk) applyClickEffect(vk);
            }
            return;
        }

        // Block all other unmapped printable chars
        e.preventDefault();
    });

    // ─── MOBILE / beforeinput ────────────────────────────────────────────────
    // On mobile, keydown often does not fire at all.
    // beforeinput fires BEFORE the browser inserts text, so we can intercept
    // and insert Tifinagh instead — at any cursor position.
    keyboardInput.addEventListener('beforeinput', (e) => {
        if (!e.data) return; // deletions handled by browser natively

        const raw     = e.data.replace(TASHKEEL, '');
        if (!raw) { e.preventDefault(); return; }

        // If entirely Tifinagh already (virtual key on mobile), let it through
        if ([...raw].every(isTifinagh)) return;

        e.preventDefault();

        // Digraph check (same logic as keydown)
        const pos    = keyboardInput.selectionStart;
        const selEnd = keyboardInput.selectionEnd;
        if (raw.length === 1 && pos === selEnd && pos > 0) {
            const prev    = keyboardInput.value[pos - 1];
            const digraph = (prev + raw).toLowerCase();
            if (keyMap[digraph]) {
                const val = keyboardInput.value;
                keyboardInput.value = val.substring(0, pos - 1) + keyMap[digraph] + val.substring(pos);
                keyboardInput.selectionStart = keyboardInput.selectionEnd = pos - 1 + keyMap[digraph].length;
                keyboardInput.focus();
                return;
            }
        }

        insertAtCursor(toTifinagh(raw));
    });

    // ─── SAFETY NET (input event) ────────────────────────────────────────────
    // Catches paste, autocorrect, voice input, etc.
    // Scans the full value and converts any stray Latin/Arabic characters.
    keyboardInput.addEventListener('input', function () {
        const val = this.value;
        const pos = this.selectionStart;

        // Quick bail-out if nothing to convert
        if (!/[a-zA-Z\u0600-\u06FF]/.test(val)) return;

        // Strip ة anywhere
        if (val.includes('ة')) {
            this.value = val.replace(/ة/g, '');
            this.selectionStart = this.selectionEnd = Math.max(0, pos - 1);
            return;
        }

        // Convert full value, keep cursor in the right place
        const converted = toTifinagh(val);
        if (converted !== val) {
            const beforeCursor   = val.substring(0, pos);
            const convBefore     = toTifinagh(beforeCursor);
            this.value           = converted;
            this.selectionStart  = this.selectionEnd = convBefore.length;
        }
    });

    // ─── COPY ────────────────────────────────────────────────────────────────
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            keyboardInput.select();
            const text = keyboardInput.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => flash(copyBtn)).catch(() => fallbackCopy(text));
            } else {
                fallbackCopy(text);
            }
            keyboardInput.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            keyboardInput.value = '';
            keyboardInput.focus();
        });
    }

    function flash(btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 1500);
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); if (copyBtn) flash(copyBtn); } catch(e) {}
        document.body.removeChild(ta);
    }

    // ─── KEY PRESS EFFECT ────────────────────────────────────────────────────
    function applyClickEffect(el) {
        if (!el) return;
        el.classList.add('key-active');
        setTimeout(() => el.classList.remove('key-active'), 150);
    }

    // ─── COPYRIGHT YEAR ──────────────────────────────────────────────────────
    const yr = document.getElementById('copyright-year');
    if (yr) yr.textContent = new Date().getFullYear();
});

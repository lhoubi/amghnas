import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Support large payload for high-res photo uploads (up to 20MB base64)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_PRIORITY = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];

async function callGeminiWithFallback(requestPayload) {
  let lastError = null;
  for (const model of MODEL_PRIORITY) {
    try {
      const response = await ai.models.generateContent({
        ...requestPayload,
        model
      });
      return response;
    } catch (err) {
      console.warn(`Model ${model} failed, trying next fallback:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

// Transliteration helper for Tifinagh to Latin (Talatint)
const tifinaghToTalatintMap = {
  'ⴰ': 'a', 'ⴱ': 'b', 'ⴳ': 'g', 'ⴷ': 'd', 'ⴹ': 'ḍ',
  'ⴻ': 'e', 'ⴼ': 'f', 'ⴽ': 'k', 'ⵀ': 'h', 'ⵃ': 'ḥ',
  'ⵄ': 'ɛ', 'ⵅ': 'x', 'ⵇ': 'q', 'ⵉ': 'i', 'ⵊ': 'j',
  'ⵍ': 'l', 'ⵎ': 'm', 'ⵏ': 'n', 'ⵠ': 'v', 'ⵓ': 'u',
  'ⵔ': 'r', 'ⵕ': 'ṛ', 'ⵖ': 'ɣ', 'ⵙ': 's', 'ⵚ': 'ṣ',
  'ⵛ': 'š', 'ⵜ': 't', 'ⵟ': 'ṭ', 'ⵝ': 'th', 'ⵞ': 'č',
  'ⵡ': 'w', 'ⵢ': 'y', 'ⵣ': 'z', 'ⵥ': 'ẓ', 'ⵒ': 'p'
};

function transliterateTifinaghToLatin(tifinagh) {
  if (!tifinagh) return '';
  return tifinagh.split('').map(c => tifinaghToTalatintMap[c] || c).join('');
}

// Translation endpoint for Amazigh text (Tifinagh or Latin Talatint) -> English & Arabic
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided for translation.' });
    }

    const response = await callGeminiWithFallback({
      contents: `You are an expert Amazigh (Tamazight) translator and linguist.
Translate this Amazigh text into English and Arabic. The text may be in Tifinagh script or Latin transliteration (Talatint):
"${text.trim()}"

Provide the response in valid JSON:
{
  "tifinagh": "Clean Tifinagh script",
  "latin": "Clean Latin transliteration (Talatint)",
  "translation_en": "Accurate English translation",
  "translation_ar": "الترجمة الدقيقة باللغة العربية",
  "notes": "Short grammatical note or etymology (optional)"
}`,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    if (response && response.text) {
      try {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed });
      } catch (parseErr) {
        return res.json({
          success: true,
          data: {
            tifinagh: text,
            latin: transliterateTifinaghToLatin(text),
            translation_en: response.text,
            translation_ar: '',
            notes: ''
          }
        });
      }
    }

    return res.status(500).json({ error: 'Empty translation response.' });
  } catch (err) {
    console.error('Error in /api/translate:', err);
    return res.status(500).json({ error: 'Translation failed', details: err.message });
  }
});

// Serve static assets and HTML files with extensions enabled
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Fallback handling for missing pages
app.use((req, res) => {
  if (req.path.startsWith('/ar')) {
    res.status(404).sendFile(path.join(__dirname, 'ar', 'index.html'));
  } else if (req.path.startsWith('/fr')) {
    res.status(404).sendFile(path.join(__dirname, 'fr', 'index.html'));
  } else {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, HOST, () => {
  console.log(`amghnas server running on http://${HOST}:${PORT}`);
});

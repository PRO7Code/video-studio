# Episode audio settings (design — implemented after the identity is approved)

Goal: "Produce GR-002 with American English voice and the approved STEP DECODE sound" = only data changes.

```json
"audio": {
  "identity": "step-decode-B",            // approved sonic kit (A/B until chosen)
  "music": true,                           // identity bed; ducks automatically under any speech
  "ar": { "mode": "text-only" },           // or { "mode": "voice", "speaker": "<approved voice id>", "speed": 1.0 }
  "en": {
    "enabled": true,
    "accent": "en-US",                     // en-US | en-GB
    "speaker": "af_heart",                 // en-US: af_heart, af_bella, am_michael · en-GB: bf_emma, bm_george
    "speed": 0.92, "volume": 1.0,
    "read": ["stem", "options", "answer"],// what is spoken in English
    "timing": { "stemDelayMs": 350, "optionGapMs": 180, "answerDelayMs": 200 },
    "phonemes": { "learn": "lˈɝn" }        // explicit IPA overrides where the automatic G2P is wrong
  }
}
```
Scheduling rule (no overlaps): English lines are placed on the phase they belong to (stem after the card lands, each
option as it appears, the full correct sentence after the reveal); a phase grows automatically when its line is longer
(same mechanism as make_vo.py); Arabic and English never overlap; music ducks −9 dB under all speech.
Engines: English = Kokoro-82M (Apache-2.0); Arabic = none approved yet (Piper ar_JO-kareem: dataset licence unverified).

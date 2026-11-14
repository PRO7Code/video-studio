# Listening Decode — US vs UK Pronunciation (optional sub-series, planned)

For suitable episodes only; never forced on every STEP question. Never assume every word differs.

## Episode flow (≈20–30 s)
1. Hook: the word/sentence on screen. 2. ▶ en-US (flag + IPA). 3. ▶ en-GB (flag + IPA). 4. Replay both (slower).
5. Highlight the ACTUAL difference (IPA segment + mouth/letter cue). 6. Mini challenge ("Which accent did you hear?" or
"Which word?"). 7. Answer + Arabic explanation. Sonic identity: approved STEP DECODE kit.

## Example bank (IPA from the studio's engine, cross-checked with standard dictionary transcriptions)
| Word | en-US | en-GB | Real difference | Notes |
|---|---|---|---|---|
| water | wˈɔːɾɚ | wˈɔːtə | flap t + final r-colouring | classic, safe |
| tomato | təmˈeɪɾoʊ | təmˈɑːtəʊ | vowel eɪ vs ɑː, flap, oʊ vs əʊ | safe |
| can't | kˈænt | kˈɑːnt | æ vs ɑː | safe |
| more | mˈɔːɹ | mˈɔː | rhotic r | in sentences: "more time" |
| schedule | skˈɛdʒuːl | ʃˈɛdjuːl | sk vs ʃ | BOTH forms are heard in the UK → present as "common", not "only" |
| book | bˈʊk | bˈʊk | **none** | control item: teaches that not every word differs |
| learn | lˈɝn (correct US) | lˈɜːn | r-colouring | engine G2P gives lˈɜːn for US → pass the IPA explicitly |

Rule: every example's IPA is reviewed by the teacher; when the engine's automatic phonemes are wrong, the episode file
supplies the phonemes explicitly (Kokoro accepts IPA input).

## Episode data (draft schema)
```json
{
  "series": "listening-decode/us-uk",
  "items": [
    { "text": "water", "ipa": { "en-US": "wˈɔːɾɚ", "en-GB": "wˈɔːtə" }, "diff": ["t → ɾ", "ə → ɚ"],
      "noteAr": "الأمريكي يلفظ t قريبة من d سريعة ويُظهر r في النهاية" }
  ],
  "challenge": { "play": "en-GB", "item": 0, "askAr": "أي لهجة سمعت؟", "options": ["US", "UK"], "correct": 1,
                 "explainAr": "لا يوجد r في آخر الكلمة و t واضحة → بريطاني" },
  "voices": { "en-US": { "speaker": "af_heart", "speed": 0.9 }, "en-GB": { "speaker": "bf_emma", "speed": 0.9 } }
}
```

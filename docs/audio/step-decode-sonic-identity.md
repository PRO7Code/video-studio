# STEP DECODE — sonic identity (proposal, NOT approved yet)

Generator: `tools/audio/sonic_identity.py --variant A|B --events <events.json> --out-dir <dir>` (original, code-made,
studio-owned; no third-party audio). Events come from the episode itself: `node tools/audio/step_events.ts <props.json>`.

## Signature
4-note motif **D5 · A5 · F#5 · D6** ("de-co-de-ED"). It opens every episode, the analysis card spells it note by note
(clue → rule → meaning) and the end logo plays it in full → recognisable after a few episodes.

## Dramaturgy (both variants)
| Moment | Sound | Purpose |
|---|---|---|
| 0.0 s | motif, fast + soft sub | instant brand, sound within 20 ms (autoplay) |
| question in | breath/riser swell → 2 motif notes | attention on the question |
| options | one rising scale note per option, panned L→R | order + anticipation |
| countdown 3 s | ticks each second + accelerating pulse + rising tension, music OUT | suspense |
| end of countdown | **intentional silence 0.2–0.3 s** | contrast |
| eliminations | each strike steps UP in pitch, low drone under | tension builds toward the answer |
| 0.35 s before reveal | **silence** | the drop |
| reveal | loudest moment: chord bloom + bell/sparkle + sub | reward |
| analysis 3 steps | motif notes 1-2-3 | learning = decoding |
| end card | full motif + resolve | signature out |

## Variants
- **A · Warm Scholar** — felt piano, marimba, bell, breathy swells, heartbeat tension. Calm, premium, academic.
- **B · Decode Tech** — synth pluck, sub pulse, digital "scramble" on strikes, filter-opening reveal. Modern, energetic.

## Measured (earshot critique vs 7 professional launch films, fast mode; second-conditional episode)
| | current v2 | A | B |
|---|---|---|---|
| verdict | launch-grade 17/20 | launch-grade 18/20 | launch-grade **19/20** |
| stereo width (side vs mid) | −29.3 dB (mono) | −5.5 dB | −6.1 dB |
| mids 1–4 kHz (phone speakers) | −26.0 dB | −9.2 dB | −9.4 dB |
| loudness range | 1.3 LU | 4.0 LU | 5.0 LU |
| intentional stop-downs | 0 | 3 (8.2, 11.0, 16.4 s) | 2 (8.2, 16.6 s) |
| hits on events | — | strikes 11.27/13.06/14.87 s, reveal 16.80 s | same |
Realness is not scored: the identity is deliberately designed (branded), not recorded foley.

## Round 2 — 2026-11-14 (B = lead candidate, C added; nothing approved)
- **C · Decode Warm**: B's tech character through the reveal, A's warm felt piano / pad / air for the explanation and
  the resolve. `--variant C`.
- Fair test: one picture (`second-conditional-en-test`, English question + answer read by af_heart), the SAME voice stem
  and the same ducking (bed −9 dB, SFX −4 dB under speech) for A/B/C; full mixes mastered to −15.0/−15.0/−15.1 LUFS and the
  comparison segments to −14.9/−15.0/−15.0 LUFS.
- English stays intelligible inside all three mixes (Whisper: exact text for question and answer in A, B and C).
- C: earshot launch-grade 19/20, stop-down 0.24 s before the reveal; minor: ending 2.4 LU above the body.

## English voice: the "learn" finding
- espeak G2P gives the en-US NURSE vowel without r (learn/bird/work/her → ɜː). en_tts.py now maps ɜː → ɜɹ for en-US
  and accepts per-word overrides (`--phoneme word=IPA`, `audio.en.phonemes`).
- Acoustic check (LPC, F3 contour; calibrated on water: US ɚ F3 ≈ 2.3 kHz vs UK ≈ 3.0 kHz): the af_heart voice
  already dips F3 to ~2.0–2.4 kHz in "learn" with or without the fix, bf_emma stays flat at ~3.0 kHz. So the audio was
  rhotic even when the IPA was not; the fix is kept for consistent input. **Human listening review is still required.**
- Kokoro stays EXPERIMENTAL until the licence review and the owner's approval for commercial publishing.

## Round 3 — owner feedback (2026-11-14)
- Owner: A (Warm Scholar) is preferred up to the answer; only B's answer-reveal sound is better; B's option "beep"
  pops are disliked → **D "Scholar Reveal"** = A everywhere + B's reveal only (`--variant D`).
- Owner asked for the "Who Wants to Be a Millionaire" thinking music: NOT used — it is copyrighted (and a melodic
  sound-alike risks takedowns / claims). Instead **`--think quiz`**: an original quiz-show tension cue (question sting with
  timpani + minor string hit, low dissonant drone under question/options, steady 120-bpm timpani pulse and rising
  tremolo cluster in the countdown, hard stop). Genre conventions only; no melody from any show.
- Checks (D and D2): English intelligible (Whisper exact), true silence 17.20–17.45 s before the reveal, reveal loudest
  section; both mastered to -15.0 LUFS.
- LEF links added to brands/lef-step/brand.json (`links`: web lef.one, TikTok @lef.one) and shown on the CTA card.

## Round 4 — hiss fix (owner heard hiss, esp. while the female voice speaks, middle + end)
Measured sources: (1) the "air" noise layer (7–15 kHz) that ran under the bed after D became warm everywhere;
(2) the noisy breath swells; (3) the int8 Kokoro voice: fizzy top end + sharp sibilants (speech 6–16 kHz ≈ −1 dB).
Fix: air layer removed, breath swells → tonal swells, voice chain `afftdn → deesser → lowpass 11.5 kHz → soft gate`.
7–16 kHz share (D): question −21.5 → −28.8 dB, answer −16.0 → −28.2 dB, analysis −28.4 → −38.9 dB, end −28.0 → −32.9 dB.
English intelligibility unchanged (Whisper exact). If any fizz remains, next step is the fp16 voice model (≈163 MB).

# brand.json schema
```jsonc
{
  "id": "anan",                 // folder name
  "name": "Anan Training Academy",
  "nameAr": "أكاديمية عنان للتدريب",
  "status": "ready",            // ready | needs-input (missing values fall back to the studio brand)
  "colors": {                   // hex; null = not provided yet
    "ink": "#070C18",           // background / darkest
    "primary": "#2EE6C5",       // main accent (kickers, lines, highlights)
    "secondary": "#38BDF8",     // second accent (gradients, secondary chips)
    "accent": "#FFB547",        // status / warm accent (badges)
    "text": "#F5F7FB",
    "muted": "rgba(245,247,251,0.72)"
  },
  "fonts": { "arabic": "Readex Pro", "latin": "Space Grotesk", "mono": "JetBrains Mono" }, // must be bundled in public/fonts
  "logo": "assets/logo.png",    // relative to brands/<id>/ (assets/ is git-ignored unless approved)
  "tone": "short Arabic description of voice",
  "do": [], "dont": []
}
```
Never invent a client's colours or logo: leave `null` and set `"status": "needs-input"` until the owner provides them.

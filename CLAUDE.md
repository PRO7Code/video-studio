# video-studio – rules for Claude
Use the `professional-video-director` skill for any production task. Non-negotiable:
- No paid generation, upload of private media, repo creation/push, or account/environment change without the user's
  explicit approval in this conversation. Show `hf.py estimate` numbers first; pass the approved amount as --approve-usd.
- Never commit media (`projects/*/assets|gen|keyframes|locked|out`) or secrets. Never print keys.
- Never overwrite a delivered render; version filenames.
- Don't invent people, speech or facts; label AI-generated elements in the director's note.
- Start with `bash scripts/doctor.sh`.

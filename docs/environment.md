# Environment notes (Claude Code cloud sessions)
- Containers are ephemeral: anything not pushed is lost. Run scripts/bootstrap.sh (SessionStart hook does it).
- No GPU (4 vCPU, 15 GB RAM): local diffusion/video models are impractical → APIs, or CPU tools only.
- Headless Chrome cannot reach Google Fonts → fonts are bundled in public/fonts.
- GitHub: sessions are bound to attached repos; they cannot create repositories. Create the repo on github.com,
  then attach it to the session (push access). All five existing PRO7Code repos are PUBLIC – check before adding data.
- Secrets: never in files. Cloud: network secret per host (e.g. api.higgsfield.ai, header Authorization, prefix Key).
- Freesound CDN blocks automated downloads (403); don't spoof user agents.
- The cloud environment has no setup script yet; proposed: `if [ -d video-studio ]; then bash video-studio/scripts/bootstrap.sh; fi`

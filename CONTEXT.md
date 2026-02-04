# OpenRouter Pricing Overlay - Project Context

## Overview
Chrome/Brave extension that displays token pricing (input/output per million) directly on OpenRouter pages with color-coded price tiers.

## Status
**Version:** 0.1.1  
**Stage:** Ready for public release  
**Started:** 2026-02-04

## Quick Start
```bash
# Load in browser
# 1. chrome://extensions or brave://extensions
# 2. Developer mode ON
# 3. Load unpacked → select src/
```

## Key Files
- `src/` - Extension source (manifest, content.js, styles.css, icons)
- `docs/ROADMAP.md` - Planned features (expandable hover, context window display)
- `docs/CHANGELOG.md` - Version history
- `docs/ARCHITECTURE.md` - Technical design
- `screenshots/` - README images

## Git Log (recent)
- `f46f85f` - Bump version to 0.1.1
- `adff2a5` - Fix model matching for varied URL formats
- `1e2fda0` - Add proper extension icons
- `4aff60a` - Security hardening and production cleanup
- `3eaeee9` - Add color-coded price tiers
- `4608a8d` - Improve badge positioning and model matching

## Price Tiers
| Tier | Input $/M | Color |
|------|-----------|-------|
| Free | $0 | Green |
| Cheap | <$0.50 | Blue |
| Mid | $0.50-2 | Yellow |
| Premium | $2-5 | Orange |
| Frontier | $5+ | Red |

## Known Limitations
- Badge truncation on some page sections (e.g., "fastest models") where parent container has text-overflow
- Accepted tradeoff; works well on main rankings/leaderboard

## Next Steps
1. Create GitHub repo
2. Submit to Chrome Web Store ($5 fee)
3. Optional: Implement ROADMAP items (expandable hover, context window)

## Synced Locations
- Source: `~/clawd/projects/openrouter-pricing-ext/`
- Shared: `~/nyx_core/openrouter-pricing-ext/`

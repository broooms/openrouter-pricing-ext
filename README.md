# OpenRouter Pricing Overlay

A Chrome/Brave extension that displays token pricing (input/output per million tokens) directly on OpenRouter pages.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## Features

- **Inline pricing badges** next to model names on rankings, models, and search pages
- **Smart caching** (1 hour TTL) to minimize API calls
- **SPA-aware** via MutationObserver for dynamic page updates
- **Free model highlighting** with distinct badge style

## Installation

### Developer Mode (unpacked)

1. Clone or download this repository
2. Open Chrome/Brave → `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `src/` directory

### From Release (packed)

*Coming soon*

## Usage

Navigate to any OpenRouter page:
- https://openrouter.ai/rankings
- https://openrouter.ai/models
- https://openrouter.ai/models/[provider]/[model]

Pricing badges appear automatically next to model names.

### Badge Format

| Badge | Meaning |
|-------|---------|
| `$0.50/$1.50` | Input $0.50/M tokens, Output $1.50/M tokens |
| `FREE` | Both input and output are free |
| `<$0.01/$0.05` | Input less than $0.01/M tokens |

Hover over any badge for a tooltip with the full breakdown.

## Project Structure

```
openrouter-pricing-ext/
├── src/                    # Extension source (load this in Chrome)
│   ├── manifest.json       # Extension manifest (MV3)
│   ├── content.js          # Main content script
│   └── styles.css          # Badge styling
├── icons/                  # Extension icons
│   ├── icon48.png
│   └── icon128.png
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # Technical design
│   └── CHANGELOG.md        # Version history
├── README.md               # This file
└── LICENSE                 # MIT license
```

## Development

### Prerequisites

- Chrome or Brave browser
- Basic knowledge of Chrome extension development

### Local Development

1. Make changes to files in `src/`
2. Go to `chrome://extensions`
3. Click the reload button on the extension
4. Refresh the OpenRouter page

### Testing

Manual testing checklist:
- [ ] Rankings page shows badges
- [ ] Models list page shows badges
- [ ] Individual model pages work
- [ ] Free models show "FREE" badge
- [ ] Page navigation (SPA) updates badges
- [ ] Cache works (check console logs)

## Configuration

Currently hardcoded. Future versions may include an options page for:
- Cache TTL adjustment
- Badge style preferences
- Price tier thresholds

## API

Uses the public OpenRouter API:
```
GET https://openrouter.ai/api/v1/models
```

No authentication required. Response includes pricing in `pricing.prompt` and `pricing.completion` (per-token rates).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenRouter](https://openrouter.ai) for the excellent unified LLM API
- Built with vanilla JavaScript (no build step required)

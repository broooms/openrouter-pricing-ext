# Architecture

## Overview

OpenRouter Pricing Overlay is a Chrome Manifest V3 extension that injects pricing information into OpenRouter web pages.

## Components

### Content Script (`src/content.js`)

The main logic runs as a content script injected into all `openrouter.ai` pages.

**Responsibilities:**
- Fetch and cache model pricing data from OpenRouter API
- Detect model links in the DOM
- Inject pricing badges adjacent to model names
- Observe DOM mutations for SPA navigation

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `fetchPricing()` | Fetches `/api/v1/models`, builds lookup tables, caches in localStorage |
| `buildLookups()` | Creates `byId` and `bySlug` indexes for fast model matching |
| `findModelFromHref()` | Extracts model ID from link href, handles version suffixes |
| `annotateModels()` | Scans DOM for model links, injects badges |
| `createBadge()` | Generates badge DOM element with pricing info |
| `observeChanges()` | Sets up MutationObserver for dynamic content |

### Stylesheet (`src/styles.css`)

Defines badge appearance:
- `.or-price-badge` - Base badge styling
- `.or-price-badge.free` - Green variant for free models
- `.or-price-in` / `.or-price-out` - Color-coded input/output prices

### Manifest (`src/manifest.json`)

Chrome extension configuration:
- Manifest Version 3 (required for Chrome Web Store)
- Content script injection on `openrouter.ai/*`
- No background service worker (stateless)
- No special permissions required

## Data Flow

```
┌─────────────────┐
│  Page Load      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Check Cache    │────▶│  localStorage    │
└────────┬────────┘     └──────────────────┘
         │ (miss or expired)
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Fetch API      │────▶│  /api/v1/models  │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Build Lookups  │
│  (byId, bySlug) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scan DOM       │
│  Find Links     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Inject Badges  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Observe DOM    │
│  (MutationObserver)
└─────────────────┘
```

## Model Matching Strategy

OpenRouter URLs use the pattern `/<provider>/<model-slug>`. The extension matches these against API data using:

1. **Exact match**: `provider/model-slug` directly in `byId`
2. **Case-insensitive**: Lowercase version of the ID
3. **Slug-only**: Just the model name part in `bySlug`
4. **Version stripping**: Remove date suffixes like `-20251217`

This handles cases where the page links to a specific model version but our API data has the base model.

## Caching

- **Storage**: `localStorage` under key `or_pricing_cache`
- **TTL**: 1 hour (configurable via `CACHE_TTL` constant)
- **Structure**: `{ data: { models, byId, bySlug }, timestamp }`
- **Invalidation**: Automatic on TTL expiry; manual via localStorage clear

## Performance Considerations

- **Debouncing**: MutationObserver callbacks are debounced (200ms)
- **Processed tracking**: Elements marked with `data-or-priced` to avoid re-processing
- **Lazy injection**: Badges only created when needed, not pre-rendered
- **No external dependencies**: Vanilla JS, minimal footprint

## Security

- No sensitive data collected or transmitted
- API calls only to `openrouter.ai` (same origin policy)
- No background scripts or persistent connections
- Content script runs in isolated world (no access to page JS)

## Future Considerations

- **Options page**: User-configurable cache TTL, badge styles, price thresholds
- **Background worker**: For cross-tab cache synchronization
- **Popup UI**: Quick stats, manual cache refresh, enable/disable toggle
- **Price alerts**: Notify when favorite models change price

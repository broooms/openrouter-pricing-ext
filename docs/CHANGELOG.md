# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-04

### Added
- Initial release
- Content script for injecting pricing badges on OpenRouter pages
- Support for rankings, models list, and individual model pages
- Smart model matching (exact, case-insensitive, slug-only, version-stripped)
- LocalStorage caching with 1-hour TTL
- MutationObserver for SPA navigation support
- Distinct "FREE" badge styling for zero-cost models
- Hover tooltips with full price breakdown

### Technical
- Chrome Manifest V3 compliant
- No build step required (vanilla JS)
- Tested on Chrome and Brave browsers

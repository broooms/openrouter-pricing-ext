# Roadmap

Planned improvements for OpenRouter Pricing Overlay.

## v0.2.0 - Visual Polish & Data Enrichment

### 1. Improved Badge Positioning
**Priority:** High  
**Status:** Planned

Current badges appear after the link element, which can cause awkward spacing. Improve to:
- Inline with model name (same line, tighter spacing)
- Smaller bounding box (reduce padding, smaller font)
- Consistent alignment across different page layouts (rankings vs models list vs search)

**Technical notes:**
- May need to inject badge *inside* the link or find a better insertion point
- Test across all OpenRouter page types
- Consider using `display: inline-flex` with `align-items: center`

---

### 2. Color-Coded Price Tiers
**Priority:** High  
**Status:** Planned

Visual indication of relative cost at a glance:

| Tier | Input $/M | Color | Example Models |
|------|-----------|-------|----------------|
| Free | $0 | Green | Free tier models |
| Budget | <$0.50 | Blue | Llama, Mistral small |
| Mid | $0.50-$5 | Yellow/Amber | GPT-4o-mini, Claude Haiku |
| Premium | $5-$20 | Orange | GPT-4o, Claude Sonnet |
| Frontier | >$20 | Red/Purple | GPT-4, Claude Opus |

**Technical notes:**
- Thresholds should be configurable (future options page)
- Use CSS classes: `.tier-free`, `.tier-budget`, `.tier-mid`, `.tier-premium`, `.tier-frontier`
- Consider using output price, input price, or average for tier calculation

---

### 3. Expandable Badge on Hover
**Priority:** Medium  
**Status:** Planned

Compact badge by default, expands on hover to show detailed info:

**Collapsed state:**
```
[$$$]  or  [~$2]  or  [$0.50]
```

**Expanded state (on hover):**
```
┌─────────────────────────┐
│ Input:  $0.50/M tokens  │
│ Output: $1.50/M tokens  │
│ Context: 128K tokens    │
│ ──────────────────────  │
│ Est. cost: $0.02/1K out │
└─────────────────────────┘
```

**Technical notes:**
- Use CSS transitions for smooth expand/collapse
- `position: absolute` tooltip or inline expansion
- Ensure doesn't overflow viewport (flip direction if near edge)
- Consider click-to-pin for mobile/touch users

---

### 4. Context Window Display
**Priority:** Medium  
**Status:** Planned

Show context length alongside price. Users often need both to evaluate models.

**Display options:**
- In expanded hover tooltip (see above)
- As secondary line: `$0.50/$1.50 · 128K`
- Icon indicator: `$0.50/$1.50 📏128K`

**Technical notes:**
- Data already available in API response (`context_length` field)
- Format as: 4K, 32K, 128K, 200K, 1M (human-readable)
- Consider showing max completion tokens too if significantly different

---

## Future Ideas (Unprioritized)

- **Options popup:** Configure cache TTL, color thresholds, badge style
- **Sort overlay:** "Show cheapest first" toggle on rankings page
- **Model comparison:** Select multiple models to compare side-by-side
- **Price alerts:** Notify when tracked models change price
- **Arena score integration:** Show quality/price ratio
- **Keyboard shortcuts:** Toggle badges on/off
- **Export:** Download comparison as CSV/JSON

---

## Contributing

Pick an item, implement it, test thoroughly, commit with clear message referencing this roadmap.

Version bumps:
- Bug fixes: patch (0.1.x)
- New features: minor (0.x.0)
- Breaking changes: major (x.0.0)

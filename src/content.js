// OpenRouter Pricing Overlay - Content Script
// https://github.com/yourusername/openrouter-pricing-ext

(function() {
  'use strict';

  const CACHE_KEY = 'or_pricing_cache_v1';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  let pricingData = null;

  /**
   * Format price as $/M tokens
   * @param {string|number} pricePerToken - Price per token from API
   * @returns {string} Formatted price string
   */
  function formatPrice(pricePerToken) {
    if (!pricePerToken || pricePerToken === '0') return 'free';
    const perMillion = parseFloat(pricePerToken) * 1_000_000;
    if (isNaN(perMillion)) return '?';
    if (perMillion < 0.01) return '<$0.01';
    if (perMillion < 1) return '$' + perMillion.toFixed(2);
    if (perMillion < 10) return '$' + perMillion.toFixed(1);
    return '$' + Math.round(perMillion);
  }

  /**
   * Determine price tier based on input price per million tokens
   * @param {string|number} pricePerToken - Price per token from API
   * @returns {string} Tier name: free, cheap, mid, premium, frontier
   */
  function getPriceTier(pricePerToken) {
    if (!pricePerToken || pricePerToken === '0') return 'free';
    const perMillion = parseFloat(pricePerToken) * 1_000_000;
    if (isNaN(perMillion) || perMillion < 0.50) return 'cheap';
    if (perMillion < 2.0) return 'mid';
    if (perMillion < 5.0) return 'premium';
    return 'frontier';
  }

  /**
   * Create pricing badge element using safe DOM methods
   * @param {Object} model - Model object with pricing info
   * @returns {HTMLSpanElement} Badge element
   */
  function createBadge(model) {
    const pricing = model.pricing || {};
    const inPrice = formatPrice(pricing.prompt);
    const outPrice = formatPrice(pricing.completion);
    const tier = getPriceTier(pricing.prompt);

    const badge = document.createElement('span');
    badge.className = `or-price-badge tier-${tier}`;
    badge.title = `Input: ${inPrice}/M · Output: ${outPrice}/M tokens`;

    if (tier === 'free') {
      badge.textContent = 'FREE';
    } else {
      // Build DOM safely without innerHTML
      const inSpan = document.createElement('span');
      inSpan.className = 'or-price-in';
      inSpan.textContent = inPrice;

      const sep = document.createElement('span');
      sep.className = 'or-price-sep';
      sep.textContent = '/';

      const outSpan = document.createElement('span');
      outSpan.className = 'or-price-out';
      outSpan.textContent = outPrice;

      badge.appendChild(inSpan);
      badge.appendChild(sep);
      badge.appendChild(outSpan);
    }

    return badge;
  }

  /**
   * Build lookup tables for flexible model matching
   * @param {Array} models - Array of model objects from API
   * @returns {Object} Lookup tables { byId, bySlug }
   */
  function buildLookups(models) {
    const byId = {};
    const bySlug = {};

    // Strip version suffixes: -YYYYMMDD, -MM-DD, -vX.X, etc.
    function stripVersion(str) {
      return str
        .replace(/-\d{8}$/, '')      // -20251217
        .replace(/-\d{2}-\d{2}$/, '') // -04-28
        .replace(/-v?\d+(\.\d+)*$/, ''); // -v1.0, -1.5
    }

    for (const model of models) {
      if (!model.id) continue;

      // Index by full ID
      byId[model.id] = model;
      byId[model.id.toLowerCase()] = model;

      // Index by version-stripped ID
      const strippedId = stripVersion(model.id);
      if (strippedId !== model.id) {
        byId[strippedId] = model;
        byId[strippedId.toLowerCase()] = model;
      }

      // Index by model name part (without provider)
      const parts = model.id.split('/');
      if (parts.length === 2) {
        const [, name] = parts;
        bySlug[name] = model;
        bySlug[name.toLowerCase()] = model;

        const strippedName = stripVersion(name);
        if (strippedName !== name) {
          bySlug[strippedName] = model;
          bySlug[strippedName.toLowerCase()] = model;
        }
      }

      // Index by display name
      if (model.name) {
        bySlug[model.name.toLowerCase()] = model;
      }
    }

    return { byId, bySlug };
  }

  /**
   * Fetch and cache pricing data from OpenRouter API
   * @returns {Promise<Object>} Pricing data with lookup tables
   */
  async function fetchPricing() {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && data && data.byId) {
          return data;
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // Fetch fresh data
    const resp = await fetch('https://openrouter.ai/api/v1/models');
    if (!resp.ok) {
      throw new Error(`API returned ${resp.status}`);
    }

    const json = await resp.json();
    const models = json.data || [];
    const lookups = buildLookups(models);
    const result = { models, byId: lookups.byId, bySlug: lookups.bySlug };

    // Cache the result
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (e) {
      // localStorage might be full or disabled; continue without caching
    }

    return result;
  }

  /**
   * Find model from href like /google/gemini-3-flash-preview
   * @param {string} href - Link href attribute
   * @returns {Object|null} Model object or null
   */
  function findModelFromHref(href) {
    if (!href || !pricingData || !pricingData.byId) return null;

    const match = href.match(/^\/([a-z0-9_-]+)\/([a-z0-9._-]+)/i);
    if (!match) return null;

    const [, provider, modelSlug] = match;

    // Skip non-model pages
    const skipPaths = [
      'docs', 'chat', 'models', 'rankings', 'pricing', 'apps',
      'settings', 'keys', 'activity', 'credits', 'api', 'providers',
      'about', 'announcements', 'careers', 'partners', 'privacy',
      'terms', 'support', 'enterprise', 'sdk'
    ];
    if (skipPaths.includes(provider.toLowerCase())) {
      return null;
    }

    // Try exact match
    const modelId = `${provider}/${modelSlug}`;
    let model = pricingData.byId[modelId] || pricingData.byId[modelId.toLowerCase()];
    if (model) return model;

    // Try slug-only match
    model = pricingData.bySlug[modelSlug] || pricingData.bySlug[modelSlug.toLowerCase()];
    if (model) return model;

    // Try version-stripped match
    const slugBase = modelSlug
      .replace(/-\d{8}$/, '')
      .replace(/-\d{2}-\d{2}$/, '')
      .replace(/-v?\d+(\.\d+)*$/, '');
    if (slugBase !== modelSlug) {
      const baseId = `${provider}/${slugBase}`;
      model = pricingData.byId[baseId] || pricingData.byId[baseId.toLowerCase()];
      if (model) return model;
      model = pricingData.bySlug[slugBase] || pricingData.bySlug[slugBase.toLowerCase()];
      if (model) return model;
    }

    return null;
  }

  /**
   * Find and annotate model elements on the page
   */
  function annotateModels() {
    if (!pricingData || !pricingData.byId) return;

    document.querySelectorAll('a[href^="/"]').forEach(link => {
      if (link.querySelector('.or-price-badge')) return;
      if (link.dataset.orPriced === 'true') return;

      const href = link.getAttribute('href');
      const model = findModelFromHref(href);
      if (!model) return;

      const badge = createBadge(model);

      // Insert inside simple text links for better alignment,
      // after complex ones to avoid breaking their structure
      if (link.children.length === 0) {
        link.appendChild(badge);
      } else {
        link.after(badge);
      }

      link.dataset.orPriced = 'true';
    });
  }

  /**
   * Observe DOM changes for SPA navigation
   */
  function observeChanges() {
    let timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(annotateModels, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize the extension
   */
  async function init() {
    try {
      pricingData = await fetchPricing();
      annotateModels();
      observeChanges();
    } catch (err) {
      // Silently fail - extension is non-critical
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

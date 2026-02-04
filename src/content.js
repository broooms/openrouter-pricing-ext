// OpenRouter Pricing Overlay - Content Script
// Fetches model pricing and injects badges into the page

(function() {
  'use strict';

  const CACHE_KEY = 'or_pricing_cache';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  let pricingData = null;

  // Format price as $/M tokens
  function formatPrice(pricePerToken) {
    if (!pricePerToken || pricePerToken === '0') return 'free';
    const perMillion = parseFloat(pricePerToken) * 1_000_000;
    if (perMillion < 0.01) return '<$0.01';
    if (perMillion < 1) return '$' + perMillion.toFixed(2);
    if (perMillion < 10) return '$' + perMillion.toFixed(1);
    return '$' + Math.round(perMillion);
  }

  // Determine price tier based on input price per million tokens
  function getPriceTier(pricePerToken) {
    if (!pricePerToken || pricePerToken === '0') return 'free';
    const perMillion = parseFloat(pricePerToken) * 1_000_000;
    if (perMillion < 0.50) return 'cheap';      // <$0.50/M
    if (perMillion < 2.0) return 'mid';         // $0.50-2/M
    if (perMillion < 5.0) return 'premium';     // $2-5/M
    return 'frontier';                          // $5+/M
  }

  // Create pricing badge element
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
      // Compact format: $in/$out
      badge.innerHTML = `<span class="or-price-in">${inPrice}</span><span class="or-price-sep">/</span><span class="or-price-out">${outPrice}</span>`;
    }

    return badge;
  }

  // Build lookup tables for flexible model matching
  function buildLookups(models) {
    const byId = {};
    const bySlug = {};
    
    // Helper to strip version suffixes like -20251217
    function stripVersion(str) {
      return str.replace(/-\d{8}$/, '');
    }
    
    for (const model of models) {
      // Index by full ID
      byId[model.id] = model;
      byId[model.id.toLowerCase()] = model;
      
      // Index by version-stripped ID
      const strippedId = stripVersion(model.id);
      if (strippedId !== model.id) {
        byId[strippedId] = model;
        byId[strippedId.toLowerCase()] = model;
      }
      
      // Also index by just the model name part (without provider)
      const parts = model.id.split('/');
      if (parts.length === 2) {
        const [provider, name] = parts;
        bySlug[name] = model;
        bySlug[name.toLowerCase()] = model;
        
        // Index by version-stripped slug
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

  // Fetch and cache pricing data
  async function fetchPricing() {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && data && data.byId) {
          console.log('[OR Pricing] Using cached data');
          return data;
        }
      } catch (e) {
        console.log('[OR Pricing] Cache invalid, fetching fresh');
        localStorage.removeItem(CACHE_KEY);
      }
    }

    console.log('[OR Pricing] Fetching fresh data...');
    const resp = await fetch('https://openrouter.ai/api/v1/models');
    const json = await resp.json();
    
    const models = json.data || [];
    const lookups = buildLookups(models);
    
    const result = { models, byId: lookups.byId, bySlug: lookups.bySlug };

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));

    console.log('[OR Pricing] Loaded', models.length, 'models');
    return result;
  }

  // Find model from href like /google/gemini-3-flash-preview
  function findModelFromHref(href) {
    if (!href || !pricingData || !pricingData.byId) return null;
    
    // Match /<provider>/<model-name> pattern
    const match = href.match(/^\/([a-z0-9_-]+)\/([a-z0-9._-]+)/i);
    if (!match) return null;
    
    const [, provider, modelSlug] = match;
    
    // Skip non-model pages
    const skipPaths = ['docs', 'chat', 'models', 'rankings', 'pricing', 'apps', 
                       'settings', 'keys', 'activity', 'credits', 'api', 'providers',
                       'about', 'announcements', 'careers', 'partners', 'privacy',
                       'terms', 'support', 'enterprise', 'sdk'];
    if (skipPaths.includes(provider.toLowerCase())) {
      return null;
    }
    
    // Try exact match first
    const modelId = `${provider}/${modelSlug}`;
    let model = pricingData.byId[modelId] || pricingData.byId[modelId.toLowerCase()];
    if (model) return model;
    
    // Try slug-only match
    model = pricingData.bySlug[modelSlug] || pricingData.bySlug[modelSlug.toLowerCase()];
    if (model) return model;
    
    // Try partial match (model slug might have version suffix not in our data)
    // e.g., "gemini-3-flash-preview-20251217" vs "gemini-3-flash-preview"
    const slugBase = modelSlug.replace(/-\d{8}$/, ''); // Remove date suffix like -20251217
    if (slugBase !== modelSlug) {
      const baseId = `${provider}/${slugBase}`;
      model = pricingData.byId[baseId] || pricingData.byId[baseId.toLowerCase()];
      if (model) return model;
      model = pricingData.bySlug[slugBase] || pricingData.bySlug[slugBase.toLowerCase()];
      if (model) return model;
    }
    
    return null;
  }

  // Find and annotate model elements
  function annotateModels() {
    if (!pricingData || !pricingData.byId) {
      console.log('[OR Pricing] No pricing data available');
      return;
    }

    let annotated = 0;
    
    // Find all links that might be model links
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      // Skip if already processed
      if (link.querySelector('.or-price-badge')) return;
      if (link.dataset.orPriced === 'true') return;
      
      const href = link.getAttribute('href');
      const model = findModelFromHref(href);
      
      if (!model) {
        return;
      }
      
      // Create and insert badge
      const badge = createBadge(model);
      
      // Try to insert inside the link for better alignment
      // But only if the link contains just text (not complex markup)
      const linkChildren = link.children;
      if (linkChildren.length === 0) {
        // Simple text link - append inside
        link.appendChild(badge);
      } else {
        // Complex link structure - insert after
        link.after(badge);
      }
      
      link.dataset.orPriced = 'true';
      annotated++;
    });
    
    if (annotated > 0) {
      console.log('[OR Pricing] Annotated', annotated, 'models');
    }
  }

  // Observe DOM changes for SPA navigation
  function observeChanges() {
    let timeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(annotateModels, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  async function init() {
    try {
      // Clear old cache to force fresh fetch (for debugging)
      localStorage.removeItem(CACHE_KEY);
      
      pricingData = await fetchPricing();
      console.log('[OR Pricing] Data loaded, byId keys:', Object.keys(pricingData.byId).length);
      annotateModels();
      observeChanges();
      console.log('[OR Pricing] Initialized successfully');
    } catch (err) {
      console.error('[OR Pricing] Init failed:', err);
    }
  }

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * BeautyAudit Pricelist Embed Script
 * Usage: <script src="https://app.beautyaudit.pl/embed.js" data-pricelist="PRICELIST_ID"></script>
 */
(function() {
  'use strict';

  var API_BASE = 'https://app.beautyaudit.pl';
  var SCRIPT_ATTR = 'data-pricelist';

  // Find the script tag that loaded this file
  var scripts = document.querySelectorAll('script[' + SCRIPT_ATTR + ']');

  scripts.forEach(function(script) {
    var pricelistId = script.getAttribute(SCRIPT_ATTR);
    if (!pricelistId) return;

    // Create container if not exists
    var container = script.previousElementSibling;
    if (!container || !container.classList.contains('beautyaudit-pricelist')) {
      container = document.createElement('div');
      container.className = 'beautyaudit-pricelist';
      script.parentNode.insertBefore(container, script);
    }

    // Show loading state using safe DOM methods
    container.textContent = '';
    var loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'text-align:center;padding:2rem;color:#888;';
    loadingDiv.textContent = 'Ladowanie cennika...';
    container.appendChild(loadingDiv);

    // Fetch pricelist data
    fetch(API_BASE + '/api/pricelist?id=' + encodeURIComponent(pricelistId))
      .then(function(res) {
        if (!res.ok) throw new Error('Nie znaleziono cennika');
        return res.json();
      })
      .then(function(data) {
        renderPricelist(container, data);
      })
      .catch(function(err) {
        container.textContent = '';
        var errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'text-align:center;padding:2rem;color:#c00;';
        errorDiv.textContent = err.message;
        container.appendChild(errorDiv);
      });
  });

  function renderPricelist(container, data) {
    var pricingData = JSON.parse(data.pricingDataJson);
    var theme = data.themeConfigJson ? JSON.parse(data.themeConfigJson) : getDefaultTheme();

    // Inject styles
    var styleId = 'beautyaudit-styles';
    if (!document.getElementById(styleId)) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = generateStyles(theme);
      document.head.appendChild(style);

      // Load fonts
      var fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=' +
        encodeURIComponent(theme.fontHeading) + ':wght@400;600;700&family=' +
        encodeURIComponent(theme.fontBody) + ':wght@300;400;500;700&display=swap';
      document.head.appendChild(fontLink);
    }

    // Clear container and render using safe DOM methods
    container.textContent = '';
    var pricingDiv = document.createElement('div');
    pricingDiv.className = 'ba-pricing';

    pricingData.categories.forEach(function(cat, index) {
      pricingDiv.appendChild(createCategoryElement(cat, index === 0));
    });

    container.appendChild(pricingDiv);
  }

  function getDefaultTheme() {
    return {
      primaryColor: '#D4A574',
      secondaryColor: '#FDF8F4',
      textColor: '#1e293b',
      mutedColor: '#64748b',
      boxBgColor: '#ffffff',
      boxBorderColor: '#e2e8f0',
      promoColor: '#dc2626',
      promoBgColor: '#fef2f2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter'
    };
  }

  function generateStyles(theme) {
    return '\n' +
      '.ba-pricing { font-family: "' + theme.fontBody + '", sans-serif; max-width: 800px; margin: 0 auto; color: ' + theme.textColor + '; box-sizing: border-box; }\n' +
      '.ba-pricing * { box-sizing: border-box; }\n' +
      '.ba-pricing details { margin-bottom: 1rem; border: 1px solid ' + theme.boxBorderColor + '; border-radius: 0.75rem; overflow: hidden; background: ' + theme.boxBgColor + '; }\n' +
      '.ba-pricing summary { padding: 1.25rem; background: ' + theme.boxBgColor + '; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1.125rem; color: ' + theme.textColor + '; font-family: "' + theme.fontHeading + '", serif; }\n' +
      '.ba-pricing summary:hover { background-color: ' + theme.secondaryColor + '; }\n' +
      '.ba-pricing details[open] summary { background-color: ' + theme.secondaryColor + '; border-bottom: 1px solid ' + theme.boxBorderColor + '; }\n' +
      '.ba-pricing summary::-webkit-details-marker { display: none; }\n' +
      '.ba-pricing summary .ba-icon { transition: transform 0.2s; color: ' + theme.primaryColor + '; }\n' +
      '.ba-pricing details[open] summary .ba-icon { transform: rotate(180deg); }\n' +
      '.ba-pricing .ba-services { padding: 1.25rem; background: ' + theme.boxBgColor + '; }\n' +
      '.ba-pricing .ba-service { display: flex; flex-direction: column; align-items: flex-start; padding: 1.25rem 1rem; border-bottom: 1px solid ' + theme.boxBorderColor + '; }\n' +
      '.ba-pricing .ba-service:last-child { border-bottom: none; }\n' +
      '.ba-pricing .ba-service-main { display: flex; align-items: flex-start; gap: 1rem; width: 100%; }\n' +
      '.ba-pricing .ba-service.ba-promo { background: ' + theme.promoBgColor + '; border-radius: 0.5rem; border: 1px solid ' + theme.promoColor + '33; margin-bottom: 0.5rem; }\n' +
      '.ba-pricing .ba-service-img img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid ' + theme.boxBorderColor + '; }\n' +
      '.ba-pricing .ba-service-content { flex: 1; min-width: 0; }\n' +
      '.ba-pricing .ba-service-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }\n' +
      '.ba-pricing .ba-service-name { font-weight: 600; font-size: 1.1rem; color: ' + theme.textColor + '; line-height: 1.3; }\n' +
      '.ba-pricing .ba-tags { display: flex; gap: 4px; flex-wrap: wrap; }\n' +
      '.ba-pricing .ba-tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.6rem; border-radius: 99px; font-weight: 700; white-space: nowrap; }\n' +
      '.ba-pricing .ba-tag-promo { background: ' + theme.promoColor + '; color: ' + theme.boxBgColor + '; }\n' +
      '.ba-pricing .ba-tag-std { background: ' + theme.secondaryColor + '; color: ' + theme.primaryColor + '; }\n' +
      '.ba-pricing .ba-service-desc { font-size: 0.9rem; color: ' + theme.mutedColor + '; margin: 0.25rem 0 0 0; line-height: 1.5; }\n' +
      '.ba-pricing .ba-service-duration { font-size: 0.75rem; color: ' + theme.mutedColor + '; opacity: 0.8; margin: 0.35rem 0 0 0; font-weight: 500; }\n' +
      '.ba-pricing .ba-service-price { margin-top: 0.75rem; font-weight: 700; color: ' + theme.primaryColor + '; font-size: 1.25rem; width: 100%; text-align: left; }\n' +
      '.ba-pricing .ba-service.ba-promo .ba-service-price { color: ' + theme.promoColor + '; }\n';
  }

  function createCategoryElement(cat, isOpen) {
    var details = document.createElement('details');
    details.className = 'ba-category';
    if (isOpen) details.open = true;

    var summary = document.createElement('summary');

    var titleSpan = document.createElement('span');
    titleSpan.className = 'ba-category-title';
    titleSpan.textContent = cat.categoryName + ' ';
    var countSmall = document.createElement('small');
    countSmall.textContent = '(' + cat.services.length + ')';
    titleSpan.appendChild(countSmall);

    var iconSpan = document.createElement('span');
    iconSpan.className = 'ba-icon';
    iconSpan.textContent = '\u25BC'; // Down arrow

    summary.appendChild(titleSpan);
    summary.appendChild(iconSpan);
    details.appendChild(summary);

    var servicesDiv = document.createElement('div');
    servicesDiv.className = 'ba-services';

    cat.services.forEach(function(svc) {
      servicesDiv.appendChild(createServiceElement(svc));
    });

    details.appendChild(servicesDiv);
    return details;
  }

  function createServiceElement(svc) {
    var serviceDiv = document.createElement('div');
    serviceDiv.className = 'ba-service' + (svc.isPromo ? ' ba-promo' : '');

    var mainDiv = document.createElement('div');
    mainDiv.className = 'ba-service-main';

    // Image (if exists)
    if (svc.imageUrl) {
      var imgDiv = document.createElement('div');
      imgDiv.className = 'ba-service-img';
      var img = document.createElement('img');
      img.src = svc.imageUrl;
      img.alt = svc.name || '';
      imgDiv.appendChild(img);
      mainDiv.appendChild(imgDiv);
    }

    // Content
    var contentDiv = document.createElement('div');
    contentDiv.className = 'ba-service-content';

    // Header with name and tags
    var headerDiv = document.createElement('div');
    headerDiv.className = 'ba-service-header';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'ba-service-name';
    nameSpan.textContent = svc.name || '';
    headerDiv.appendChild(nameSpan);

    // Tags
    if (svc.isPromo || (svc.tags && svc.tags.length > 0)) {
      var tagsDiv = document.createElement('div');
      tagsDiv.className = 'ba-tags';

      if (svc.isPromo) {
        var promoTag = document.createElement('span');
        promoTag.className = 'ba-tag ba-tag-promo';
        promoTag.textContent = 'Promocja';
        tagsDiv.appendChild(promoTag);
      }

      if (svc.tags) {
        svc.tags.forEach(function(tag) {
          var tagSpan = document.createElement('span');
          tagSpan.className = 'ba-tag ba-tag-std';
          tagSpan.textContent = tag;
          tagsDiv.appendChild(tagSpan);
        });
      }

      headerDiv.appendChild(tagsDiv);
    }

    contentDiv.appendChild(headerDiv);

    // Description
    if (svc.description) {
      var descP = document.createElement('p');
      descP.className = 'ba-service-desc';
      descP.textContent = svc.description;
      contentDiv.appendChild(descP);
    }

    // Duration
    if (svc.duration) {
      var durationP = document.createElement('p');
      durationP.className = 'ba-service-duration';
      durationP.textContent = svc.duration;
      contentDiv.appendChild(durationP);
    }

    mainDiv.appendChild(contentDiv);
    serviceDiv.appendChild(mainDiv);

    // Price
    var priceDiv = document.createElement('div');
    priceDiv.className = 'ba-service-price';
    priceDiv.textContent = svc.price || '';
    serviceDiv.appendChild(priceDiv);

    return serviceDiv;
  }
})();

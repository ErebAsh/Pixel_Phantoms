/*
PageTransitions Module
- Intercepts internal navigation and applies exit/enter animations
- Uses History API for smooth navigation and back/forward handling
- Respects prefers-reduced-motion
- Has safe fallbacks when JS or fetch fails (graceful degradation)

Usage:
  PageTransitions.init({ duration: 300, type: 'fade-slide', scrollToTop: true, showLoadingIndicator: true });
*/
(function (window, document) {
  'use strict';

  const PageTransitions = (function () {
    // Default config
    const DEFAULTS = {
      duration: 300,
      type: 'fade-slide', // 'fade' | 'slide' | 'fade-slide'
      scrollToTop: true,
      showLoadingIndicator: true,
      loadingThreshold: 500 // ms
    };

    // Utilities
    const isInternalLink = (link) => {
      try {
        const url = new URL(link.href, location.href);
        return url.origin === location.origin && !link.hasAttribute('download');
      } catch (e) {
        return false;
      }
    };

    const isAnchorLink = (link) => link.hash && link.pathname === location.pathname;

    // Module state
    let config = { ...DEFAULTS };
    let isTransitioning = false;
    let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let loadingTimer = null;
    let loadingOverlay = null;

    // Helpers for DOM manipulation
    function findWrapper(doc) {
      return doc.querySelector('.page-transition-wrapper');
    }

    function runTransitionOut(oldWrapper, duration) {
      return new Promise((resolve) => {
        if (!oldWrapper || prefersReducedMotion) return resolve();

        oldWrapper.classList.add('page-exit');
        // Force reflow to ensure the initial state is applied
        oldWrapper.getBoundingClientRect();
        oldWrapper.classList.add('page-exit-active');

        setTimeout(() => {
          resolve();
        }, duration);
      });
    }

    function runTransitionIn(newWrapper, duration) {
      return new Promise((resolve) => {
        if (!newWrapper || prefersReducedMotion) return resolve();

        newWrapper.classList.add('page-enter');
        // Force reflow
        newWrapper.getBoundingClientRect();
        newWrapper.classList.add('page-enter-active');

        setTimeout(() => {
          // cleanup classes
          newWrapper.classList.remove('page-enter', 'page-enter-active');
          resolve();
        }, duration);
      });
    }

    async function fetchPage(url) {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Network response was not ok');
        const text = await res.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      } catch (err) {
        console.warn('[PageTransitions] Fetch failed, falling back to normal navigation:', err);
        throw err;
      }
    }

    function replaceContent(newDoc) {
      const newWrapper = findWrapper(newDoc);
      const oldWrapper = findWrapper(document);
      if (!newWrapper || !oldWrapper) {
        // Structure not found; fall back to full navigation
        return false;
      }

      // Replace old content
      oldWrapper.replaceWith(newWrapper.cloneNode(true));
      // Restore the document title
      document.title = newDoc.title || document.title;
      // Re-run any inline scripts inside the wrapper (simple approach)
      // Find scripts in newWrapper and execute them
      const scripts = document.querySelectorAll('.page-transition-wrapper script');
      scripts.forEach((s) => {
        const script = document.createElement('script');
        if (s.src) script.src = s.src;
        if (s.type) script.type = s.type;
        script.textContent = s.textContent;
        document.body.appendChild(script);
        // remove immediately to keep DOM clean
        script.parentNode && script.parentNode.removeChild(script);
      });

      return true;
    }

    function showLoadingIfSlow() {
      if (!config.showLoadingIndicator) return;
      clearTimeout(loadingTimer);
      loadingTimer = setTimeout(() => {
        if (!loadingOverlay) createLoadingOverlay();
        loadingOverlay.classList.add('show');
      }, config.loadingThreshold);
    }

    function hideLoading() {
      clearTimeout(loadingTimer);
      if (loadingOverlay) loadingOverlay.classList.remove('show');
    }

    function createLoadingOverlay() {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'page-loading-overlay';
      loadingOverlay.innerHTML = '<div class="page-loading-spinner" aria-hidden="true"></div><span class="visually-hidden" aria-live="polite">Loading…</span>';
      document.body.appendChild(loadingOverlay);
    }

    async function navigateTo(url, isPopState = false) {
      if (isTransitioning) return;
      isTransitioning = true;

      const oldWrapper = findWrapper(document);
      const duration = config.duration;

      try {
        // Start loading indicator timer
        showLoadingIfSlow();

        // Run exit animation
        await runTransitionOut(oldWrapper, duration);

        // Fetch new page
        const newDoc = await fetchPage(url);

        // Replace content
        const success = replaceContent(newDoc);
        if (!success) {
          // Can't replace content safely; do full navigation
          location.href = url;
          return;
        }

        // push state if not popstate
        if (!isPopState) {
          history.pushState({ url }, '', url);
        }

        // Scroll handling
        if (config.scrollToTop) window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });

        // Run enter animation on new wrapper
        const newWrapper = findWrapper(document);
        await runTransitionIn(newWrapper, duration);

        // Accessibility: focus main heading or first focusable element
        const mainHeading = newWrapper.querySelector('h1, h2, h3');
        if (mainHeading && typeof mainHeading.focus === 'function') {
          mainHeading.setAttribute('tabindex', '-1');
          mainHeading.focus({ preventScroll: true });
        }

      } catch (err) {
        // If anything fails, fallback to hard navigation
        console.error('[PageTransitions] Error during navigation: ', err);
        location.href = url;
      } finally {
        hideLoading();
        isTransitioning = false;
      }
    }

    function onLinkClick(e) {
      // Only left-click without modifier keys
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = e.target.closest('a');
      if (!anchor) return;

      // Ignore external links, downloads, anchors, targets
      if (!isInternalLink(anchor) || anchor.target === '_blank' || anchor.hasAttribute('data-no-transition') || isAnchorLink(anchor)) return;

      e.preventDefault();
      const url = anchor.href;
      navigateTo(url);
    }

    function onPopState(e) {
      const url = (e.state && e.state.url) || location.href;
      navigateTo(url, true);
    }

    function attachListeners() {
      document.addEventListener('click', onLinkClick);
      window.addEventListener('popstate', onPopState);
    }

    function detachListeners() {
      document.removeEventListener('click', onLinkClick);
      window.removeEventListener('popstate', onPopState);
    }

    function init(userConfig = {}) {
      config = { ...config, ...userConfig };
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // allow CSS variable duration to override JS duration if present
      try {
        const cssDuration = getComputedStyle(document.documentElement).getPropertyValue('--page-transition-duration');
        if (cssDuration) {
          // Parse e.g., "300ms" -> 300
          const m = cssDuration.match(/(\d+)/);
          if (m) config.duration = parseInt(m[1], 10);
        }
      } catch (e) {
        // ignore
      }

      // Attach listeners
      attachListeners();

      // Push current state so back/forward has state data
      history.replaceState({ url: location.href }, '', location.href);

      // Optional: expose debug logs
      console.info('[PageTransitions] Initialized with config:', config);
    }

    function destroy() {
      detachListeners();
      if (loadingOverlay && loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);
    }

    return {
      init,
      destroy
    };
  })();

  // Expose globally
  window.PageTransitions = PageTransitions;
})(window, document);
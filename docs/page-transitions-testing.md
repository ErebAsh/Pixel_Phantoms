# Page Transitions — Testing & Accessibility Checklist

Issue: #519 — Add smooth page transition animations

## Goals
- Verify transitions are smooth (200–400ms) and non-blocking
- Ensure prefers-reduced-motion is respected
- Ensure keyboard/focus management and screen reader compatibility
- Ensure graceful fallback when JS is disabled or when fetch fails

## Manual Checklist

### Visual & Performance
- [ ] Transitions play on internal navigation (click nav links)
- [ ] Duration feels snappy (300ms default)
- [ ] No jank on mobile devices (test on throttled CPU via DevTools)
- [ ] No CLS or content jump during transitions
- [ ] Loading spinner appears only when navigation takes longer than threshold

### Accessibility
- [ ] With `prefers-reduced-motion` enabled, all animations are disabled
- [ ] After navigation, focus moves to main heading (`h1`/`h2`) and is announced by screen readers
- [ ] Keyboard navigation works while not blocked by transitions
- [ ] Anchor links (`#section`) scroll normally and don't trigger transitions

### Robustness & Fallbacks
- [ ] Try disabling JavaScript — navigation should work as normal (full page reloads)
- [ ] Simulate failed fetch (network offline) — page should fallback to full navigation
- [ ] Rapid clicks should be debounced (no duplicate navigations)
- [ ] Back/forward browser navigation triggers transitions and content updates

## Basic Automated Smoke Test (run in Browser Console)

```js
function testPageTransitions() {
  const pm = window.PageTransitions;
  console.log('reducedMotion:', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!pm) return console.warn('PageTransitions not loaded');

  // Basic init test
  pm.init({ duration: 200, type: 'fade', scrollToTop: true, showLoadingIndicator: false });
  console.log('Initialized for testing');

  // Simulate navigation: find first internal link
  const link = document.querySelector('a[href^="/"]') || document.querySelector('a[href$=".html"]');
  if (!link) return console.warn('No test link found');

  // Observe transition start
  const wrapper = document.querySelector('.page-transition-wrapper');
  if (!wrapper) return console.warn('Wrapper missing');

  console.log('Clicking link for transition test:', link.href);
  link.click();

  setTimeout(() => {
    console.log('If content changed and animations ran, test is likely OK');
  }, 1000);
}
```

## Notes
- To change default duration, update `:root { --page-transition-duration: 300ms; }` in `css/animations.css` or pass `duration` to `PageTransitions.init()`.
- For debugging, open DevTools > Performance and record during a navigation to confirm frame rates.

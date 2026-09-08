(() => {
  'use strict';

  const root = document.documentElement;
  const activeClass = 'navigation-progress-active';
  const completeClass = 'navigation-progress-complete';
  let cleanupTimer = 0;

  function start() {
    clearTimeout(cleanupTimer);
    root.classList.remove(completeClass);
    if (root.classList.contains(activeClass)) {
      root.classList.remove(activeClass);
      void root.offsetWidth;
    }
    root.classList.add(activeClass);
  }

  function finish() {
    if (!root.classList.contains(activeClass)) return;
    root.classList.add(completeClass);
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      root.classList.remove(activeClass, completeClass);
    }, 340);
  }

  function isInternalPageLink(event, anchor) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target && anchor.target !== '_self' ||
      anchor.hasAttribute('download')
    ) return false;

    const current = new URL(location.href);
    const destination = new URL(anchor.href, current);
    if (!/^https?:$/.test(destination.protocol) && destination.protocol !== 'file:') return false;
    if (destination.origin !== current.origin) return false;
    if (destination.href === current.href) return false;

    const hashOnly =
      destination.pathname === current.pathname &&
      destination.search === current.search &&
      destination.hash !== current.hash;
    return !hashOnly;
  }

  document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (anchor && isInternalPageLink(event, anchor)) start();
  }, { capture: true });

  window.addEventListener('beforeunload', start);
  window.addEventListener('load', finish, { once: true });
  window.addEventListener('pageshow', finish);

  globalThis.kanaNavigationProgress = Object.freeze({ start, finish });
  start();
})();

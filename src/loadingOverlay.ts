const MIN_VISIBLE_MS = 520;

let shownAt = 0;
let hideTimer: number | undefined;

export function showGameLoading() {
  const overlay = document.getElementById('game-loading');
  if (!overlay) return;
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  hideTimer = undefined;
  shownAt = performance.now();
  overlay.classList.add('is-visible');
  overlay.setAttribute('aria-hidden', 'false');
}

export function hideGameLoading() {
  const overlay = document.getElementById('game-loading');
  if (!overlay) return;
  const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt));
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    hideTimer = undefined;
  }, wait);
}

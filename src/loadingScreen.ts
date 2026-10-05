const screen = () => document.getElementById('loading-screen');

export function showLoading(progress = 0, label = '動画の再生を準備中…') {
  const root = screen();
  if (!root) return;
  root.style.removeProperty('display');
  updateLoading(progress, label);
}

export function updateLoading(progress: number, label: string) {
  const root = screen();
  if (!root) return;
  const value = Math.min(100, Math.max(0, Math.round(progress * 100)));
  root.querySelector<HTMLElement>('.loading-fill')!.style.width = `${value}%`;
  root.querySelector<HTMLElement>('.loading-status')!.textContent = `${label} ${value}%`;
  root.querySelector('[role="progressbar"]')!.setAttribute('aria-valuenow', String(value));
}

export function finishLoading() {
  const root = screen();
  if (root) root.style.display = 'none';
}

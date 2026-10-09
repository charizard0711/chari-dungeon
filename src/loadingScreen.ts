const screen = () => document.getElementById('loading-screen');

export function showLoading(progress = 0, label = '動画の再生を準備中…', mode: 'boot' | 'entry' | 'stairs' = 'boot') {
  const root = screen();
  if (!root) return;
  root.dataset.mode = mode;
  root.querySelector('h2')!.textContent = mode === 'stairs' ? 'さらに深い階層へ…' : 'ダンジョンの扉を開いています…';
  root.style.removeProperty('display');
  updateLoading(progress, label);
}

export function updateLoading(progress: number, label: string) {
  const root = screen();
  if (!root) return;
  const value = Math.min(100, Math.max(0, Math.round(progress * 100)));
  root.querySelector<HTMLElement>('.loading-fill')!.style.width = `${value}%`;
  root.querySelector<HTMLElement>('.loading-status')!.textContent = label;
  root.querySelector<HTMLElement>('.loading-percent')!.textContent = `${value}%`;
  root.querySelector('[role="progressbar"]')!.setAttribute('aria-valuenow', String(value));
}

export function finishLoading() {
  const root = screen();
  if (root) root.style.display = 'none';
}

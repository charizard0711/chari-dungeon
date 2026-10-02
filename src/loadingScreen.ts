const screen = () => document.getElementById('loading-screen');

export function updateLoading(progress: number, label: string) {
  const root = screen();
  if (!root) return;
  const value = Math.min(100, Math.max(0, Math.round(progress * 100)));
  root.querySelector<HTMLElement>('.loading-fill')!.style.width = `${value}%`;
  root.querySelector<HTMLElement>('.loading-status')!.textContent = `${label} ${value}%`;
  root.querySelector('[role="progressbar"]')!.setAttribute('aria-valuenow', String(value));
}

export function finishLoading() {
  screen()?.remove();
}

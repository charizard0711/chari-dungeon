// Only count the public game; local QA and previews must not inflate visits.
(() => {
  if (location.hostname !== 'charizard0711.github.io' || !location.pathname.startsWith('/chari-dungeon/')) return;
  const id = 'G-DKP0NTF4Z8';
  try { if (localStorage.getItem('chari-dungeon:analytics-disabled') === '1') return; } catch {}
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(script);
})();

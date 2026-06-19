// install.js — nudge users to install the PWA to their home screen.
// Android/desktop Chrome: a real "Install" button via the beforeinstallprompt API.
// iPhone Safari: an instruction hint (Apple gives no programmatic prompt).
// Hidden once installed, dismissed, or already running standalone.
(function () {
  let deferred = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  const dismissed = () =>
    localStorage.getItem('gol_install_dismissed') || localStorage.getItem('gol_installed');

  const isIosSafari = () => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
    const safari = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua);
    return ios && safari;
  };

  const removeBanner = () => { const el = document.getElementById('install-banner'); if (el) el.remove(); };

  window.dismissInstall = function () {
    localStorage.setItem('gol_install_dismissed', '1');
    removeBanner();
  };

  window.triggerInstall = async function () {
    if (!deferred) return;
    deferred.prompt();
    try {
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') localStorage.setItem('gol_installed', '1');
    } catch (e) { /* ignore */ }
    deferred = null;
    removeBanner();
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();        // stop Chrome's mini-infobar; we show our own
    deferred = e;
    maybeShow();
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem('gol_installed', '1');
    removeBanner();
  });

  function maybeShow() {
    if (isStandalone() || dismissed()) return;
    if (document.getElementById('install-banner')) return;

    const ios = isIosSafari();
    if (!deferred && !ios) return;   // this browser can't be prompted

    const msg = ios
      ? `Tap <b style="color:#f0a500">Share ⬆️</b> then <b style="color:#f0a500">"Add to Home Screen"</b>`
      : `Add it to your home screen — no app store needed`;
    const actionBtn = (!ios && deferred)
      ? `<button onclick="triggerInstall()" style="flex-shrink:0;background:#f0a500;border:none;border-radius:20px;color:#000;font-weight:800;font-size:0.8rem;padding:0.5rem 1.1rem;cursor:pointer">Install</button>`
      : '';

    const div = document.createElement('div');
    div.id = 'install-banner';
    div.style.cssText = 'position:fixed;left:0.75rem;right:0.75rem;bottom:0.85rem;z-index:5000;max-width:560px;margin:0 auto;' +
      'background:linear-gradient(135deg,rgba(22,22,44,0.97),rgba(12,12,24,0.97));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'border:1px solid rgba(240,165,0,0.4);border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,0.55);' +
      'display:flex;align-items:center;gap:0.7rem;padding:0.7rem 0.85rem;animation:installSlide 0.4s ease both';
    div.innerHTML = `
      <style>@keyframes installSlide{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}</style>
      <img src="icons/icon-192.png" width="42" height="42" style="border-radius:11px;flex-shrink:0" onerror="this.style.display='none'">
      <div style="flex:1;line-height:1.25;min-width:0">
        <div style="font-size:0.86rem;font-weight:800;color:#fff">Install Gol! ⚽</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.62)">${msg}</div>
      </div>
      ${actionBtn}
      <button onclick="dismissInstall()" aria-label="Dismiss" style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);font-size:0.8rem;cursor:pointer;line-height:1">✕</button>
    `;
    document.body.appendChild(div);
  }

  // iOS never fires beforeinstallprompt, so show its hint on a short delay.
  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeShow, 3000));
})();

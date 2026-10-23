import configuration from '../config/measurement.json' with {type: 'json'};
const toolIds = new Set(['images-pdf', 'merge-pdf', 'split-pdf', 'pdf-images', 'compress-image', 'resize-image', 'convert-image', 'qr-code', 'word-counter', 'text-tools', 'password']);
export function canMeasure(config, consent, doNotTrack = false) {
  return !doNotTrack && config.enabled === true && /^G-[A-Z0-9]{6,20}$/.test(config.ga4MeasurementId) && config.certifiedConsentAdapterReady === true && config.privacyReviewed === true && consent?.analyticsAllowed === true && consent?.certifiedAdapter === true;
}
export function startMeasurement(config = configuration) {
  // No SDK request, storage or events without a real ID and explicit approved consent.
  if (!config.enabled) return;
  let loaded = false;
  const allowed = () => canMeasure(config, window.mazenConsent, navigator.doNotTrack === '1');
  const locationData = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return {language: parts[0] === 'en' ? 'en' : 'ar', tool: toolIds.has(parts[1]) ? parts[1] : null};
  };
  function activate() {
    if (!allowed()) { window['ga-disable-' + config.ga4MeasurementId] = true; return; }
    window['ga-disable-' + config.ga4MeasurementId] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4MeasurementId, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4MeasurementId);
    document.head.append(script);
    window.gtag('event', 'page_view', {page_location: location.origin + location.pathname, page_referrer: '', language: locationData().language});
  }
  function event(name) {
    const data = locationData();
    if (!loaded || !allowed() || !data.tool) return;
    window.gtag('event', name, {tool_id: data.tool, language: data.language, page_location: location.origin + location.pathname, page_referrer: ''});
  }
  document.addEventListener('click', e => {
    if (e.target.closest?.('#run')) event('tool_use');
    if (e.target.closest?.('#outputs a[href^="blob:"]')) event('tool_download');
  });
  // Text tools can run directly on input; record one use without reading input values.
  let textUseRecorded = false;
  document.addEventListener('input', e => {
    if (!textUseRecorded && allowed() && ['word-counter', 'text-tools'].includes(locationData().tool) && e.target.closest?.('#controls')) {
      textUseRecorded = true; event('tool_use');
    }
  });
  window.addEventListener('mazen:consent-change', activate);
  activate();
}

// Google Analytics 4 for Eko Create — added by Claude, 7 October 2026.
// Property: "Eko Create website" (Analytics account "eko-create", signed in as daniel.taylor@eko-create.com)
// Measurement ID: G-3NTHLEY83C
//
// The tag only runs on the real domain (eko-create.com or www.eko-create.com), so visits to the
// Netlify preview and local copies are never counted. To count every host, delete the hostname check below.
(function () {
  var MEASUREMENT_ID = 'G-3NTHLEY83C';
  var host = window.location.hostname.replace(/^www\./, '');
  if (host !== 'eko-create.com') return;

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(tag);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);
})();

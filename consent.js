/* consent.js — analytics consent gate for every soulgainz.app page.
 *
 * Google Analytics used to load unconditionally on 17 pages, including the
 * privacy policy itself, which at the same time promised "no tracking
 * cookies". GA4 sets _ga cookies. Under Qatar PDPPL / GDPR analytics needs
 * opt-in consent, and the policy has to describe what actually happens.
 *
 * Model: nothing from Google loads until the visitor accepts. Decline (or no
 * answer) = no request to googletagmanager.com at all — stricter than Consent
 * Mode's "denied" pings, and simpler to explain in the policy. The choice is
 * remembered in localStorage (sg_consent = "granted" | "denied", with a
 * timestamp) and can be changed any time from the privacy page or the app's
 * ME → Legal section, which call window.sgConsent.reset().
 *
 * Pages include exactly one line in <head>:  <script src="/consent.js" defer></script>
 * and no gtag snippet of their own.
 */
(function () {
  "use strict";
  var GA_ID = "G-K4FXCEWNFC";
  var KEY = "sg_consent";
  var VERSION = 1;                      // bump to re-ask everyone
  var RE_ASK_AFTER_MS = 365 * 864e5;    // a year, per usual DPA guidance

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || v.v !== VERSION || typeof v.t !== "number") return null;
      if (Date.now() - v.t > RE_ASK_AFTER_MS) return null;
      return v.s === "granted" ? "granted" : v.s === "denied" ? "denied" : null;
    } catch (_) { return null; }
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, s: s, t: Date.now() })); } catch (_) {}
  }

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // anonymize_ip is default in GA4 but stated explicitly; no ad signals.
    window.gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }
  function clearGACookies() {
    // Best effort: drop first-party _ga* cookies so "decline" also means
    // "stop", not just "don't start". Cookies on the bare host and its parent.
    try {
      var host = location.hostname;
      var parent = host.split(".").slice(-2).join(".");
      document.cookie.split(";").forEach(function (c) {
        var name = c.split("=")[0].trim();
        if (name.indexOf("_ga") !== 0 && name !== "_gid") return;
        [host, "." + host, "." + parent, parent].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + d;
        });
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      });
    } catch (_) {}
  }

  var el = null;
  function hide() { if (el && el.parentNode) el.parentNode.removeChild(el); el = null; }
  function show() {
    if (el || !document.body) return;
    el = document.createElement("div");
    el.id = "sg-consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Analytics consent");
    el.innerHTML =
      '<style>' +
      '#sg-consent{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:520px;margin:0 auto;' +
      'background:#161412;color:#f3ede6;border:1px solid rgba(224,123,42,.35);border-radius:14px;padding:14px 16px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.45);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'padding-bottom:calc(14px + env(safe-area-inset-bottom))}' +
      '#sg-consent p{margin:0 0 10px}#sg-consent a{color:#E07B2A}' +
      '#sg-consent .b{display:flex;gap:8px;justify-content:flex-end}' +
      '#sg-consent button{border-radius:9px;padding:9px 14px;font-weight:700;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.14);background:transparent;color:#f3ede6}' +
      '#sg-consent button.ok{background:#E07B2A;border-color:#E07B2A;color:#0C0B0A}' +
      '</style>' +
      '<p>We’d like to use Google Analytics to see which pages are useful. It sets cookies and sends your IP address to Google. ' +
      'Nothing loads unless you accept. <a href="/privacy#cookies">Details</a></p>' +
      '<div class="b"><button type="button" data-c="denied">No thanks</button><button type="button" class="ok" data-c="granted">Accept analytics</button></div>';
    el.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button[data-c]") : null;
      if (!b) return;
      decide(b.getAttribute("data-c"));
    });
    document.body.appendChild(el);
  }
  function decide(s) {
    write(s);
    hide();
    if (s === "granted") { loadGA(); return; }
    clearGACookies();
    // A script already on the page cannot be unloaded; a withdrawn consent
    // has to actually stop collection, so reload without it.
    if (loaded) { try { location.reload(); } catch (_) {} }
  }

  function init() {
    var s = read();
    if (s === "granted") loadGA();
    else if (s === null) show();
    else clearGACookies();
  }

  window.sgConsent = {
    get: read,
    grant: function () { decide("granted"); },
    deny: function () { decide("denied"); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (_) {} clearGACookies(); show(); },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

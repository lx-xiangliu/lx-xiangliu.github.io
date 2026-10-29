(() => {
  'use strict';
  const config = window.HOMEPAGE_VISITORS;
  const section = document.getElementById('visitors');
  if (!config || !section) return;
  const status = document.getElementById('visitor-status');
  const mapStatus = document.getElementById('visitor-map-status');
  const shortcut = document.getElementById('visitor-shortcut-count');
  const number = new Intl.NumberFormat('en');
  let mapPromise;
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const result = await fetch(`${config.apiOrigin}${path}`, { mode:'cors', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', ...options, signal:controller.signal });
      if (!result.ok) throw new Error('Statistics unavailable');
      return result;
    } finally { clearTimeout(timeout); }
  }
  async function recordVisit() {
    if (location.hostname !== 'lx-xiangliu.github.io' || location.protocol !== 'https:') return;
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
    const storageKey = 'homepage-visit-v1';
    let event;
    try { event = JSON.parse(sessionStorage.getItem(storageKey)); } catch (_) {}
    if (!event || Date.now() - event.at >= 30 * 60 * 1000) event = { eventId:crypto.randomUUID(), at:Date.now(), complete:false };
    if (event.complete) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(event)); } catch (_) {}
    await request('/api/collect', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({eventId:event.eventId}), keepalive:true });
    event.complete = true;
    try { sessionStorage.setItem(storageKey, JSON.stringify(event)); } catch (_) {}
  }
  async function loadStatistics() {
    try {
      const data = await (await request('/api/stats')).json();
      if (!Number.isFinite(Number(data.visits))) throw new Error('Invalid response');
      document.getElementById('visitor-total').textContent = number.format(data.visits);
      shortcut.textContent = `${number.format(data.visits)} visits`;
      status.textContent = 'Aggregate visit count · Location tracking is disabled.';
    } catch (_) { status.textContent = 'Visitor statistics are temporarily unavailable. Please try again later.'; shortcut.textContent = 'View map'; }
  }
  function loadMap() {
    if (mapPromise) return mapPromise;
    mapPromise = new Promise((resolve, reject) => {
      if (window.L?.map) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'assets/vendor/leaflet/leaflet.js';
      script.referrerPolicy = 'origin'; script.async = true;
      const timeout = setTimeout(() => reject(new Error('Map timeout')), 18000);
      script.onload = () => { clearTimeout(timeout); window.L?.map ? resolve() : reject(new Error('Map not available')); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Map unavailable')); };
      document.head.append(script);
    }).then(() => {
      document.getElementById('visitor-map').replaceChildren();
      const tileUrl = layer => `https://t0.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${encodeURIComponent(config.mapKey)}`;
      const width = document.getElementById('visitor-map').clientWidth;
      const map = L.map('visitor-map', { minZoom:0, maxZoom:8, zoomSnap:0, scrollWheelZoom:false, attributionControl:true }).setView([15,150], Math.max(0,Math.log2(width / 256)));
      const base = L.tileLayer(tileUrl('vec'), { minZoom:0, maxZoom:8, attribution:'&copy; <a href="https://www.tianditu.gov.cn/">天地图</a> · GS(2026)4921号 · 甲测资字11110974' }).addTo(map);
      L.tileLayer(tileUrl('eva'), { minZoom:0, maxZoom:8 }).addTo(map);
      mapStatus.textContent = 'Loading TianDiTu basemap…';
      base.on('tileload', () => { mapStatus.textContent = 'TianDiTu · Drag to explore; use + / − to zoom.'; });
      base.on('tileerror', () => { mapStatus.textContent = 'The basemap is temporarily unavailable; the visit counter remains available.'; });
      if ('ResizeObserver' in window) new ResizeObserver(() => map.invalidateSize({pan:false})).observe(document.getElementById('visitor-map'));
    }).catch(() => {
      mapStatus.textContent = 'The map could not be loaded. The visit counter remains available.';
      document.getElementById('visitor-map').classList.add('map-unavailable');
    });
    return mapPromise;
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { loadMap(); observer.disconnect(); } }, { rootMargin:'500px' });
    observer.observe(section);
  } else { loadMap(); }
  recordVisit().catch(() => {}).finally(loadStatistics);
})();

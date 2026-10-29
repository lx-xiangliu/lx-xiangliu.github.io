(() => {
  'use strict';
  const config = window.HOMEPAGE_VISITORS;
  const section = document.getElementById('visitors');
  if (!config || !section) return;
  const status = document.getElementById('visitor-status');
  const mapStatus = document.getElementById('visitor-map-status');
  const shortcut = document.getElementById('visitor-shortcut-count');
  const number = new Intl.NumberFormat('en');
  let locations = [], map, markers = [], mapPromise;
  const regions = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  const placeName = item => {
    const country = item.country === 'ZZ' ? 'Location unavailable' : (regions?.of(item.country) || item.country);
    return item.city && item.city !== 'Unknown city' ? `${item.city} · ${country}` : country;
  };
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
  function drawLocations() {
    if (!map || !window.T) return;
    markers.forEach(marker => map.removeOverLay(marker)); markers = [];
    for (const item of locations) {
      const point = new T.LngLat(item.longitude, item.latitude);
      const marker = new T.Marker(point);
      marker.addEventListener('click', () => {
        const content = document.createElement('div');
        const heading = document.createElement('strong'); heading.textContent = placeName(item);
        const count = document.createElement('p'); count.textContent = `${number.format(item.visits)} visits · approximate network location`;
        content.append(heading, count);
        marker.openInfoWindow(new T.InfoWindow(content.outerHTML));
      });
      map.addOverLay(marker);
      marker.getElement?.()?.setAttribute('title', `${placeName(item)}: ${number.format(item.visits)} visits`);
      markers.push(marker);
    }
  }
  async function loadStatistics() {
    try {
      const data = await (await request('/api/stats')).json();
      if (!Array.isArray(data.locations) || !Number.isFinite(Number(data.visits))) throw new Error('Invalid response');
      locations = data.locations.filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && Number(item.visits) > 0);
      document.getElementById('visitor-total').textContent = number.format(data.visits);
      document.getElementById('visitor-location-total').textContent = number.format(locations.length);
      shortcut.textContent = `${number.format(data.visits)} visits`;
      const unknown = Number(data.unmappedVisits || 0);
      status.textContent = data.visits === 0 ? 'No visits recorded yet.' : unknown ? `${number.format(unknown)} visits have no location available and are included in the total.` : 'Select a marker to see the location and visit count.';
      const list = document.getElementById('visitor-locations'); list.replaceChildren();
      for (const item of locations.slice(0, 8)) {
        const li = document.createElement('li');
        const name = document.createElement('span'); name.textContent = placeName(item);
        const count = document.createElement('span'); count.textContent = number.format(item.visits);
        li.append(name, count); list.append(li);
      }
      document.getElementById('visitor-list-caption').textContent = locations.length ? 'Most visited locations' : 'No mapped locations yet.';
      drawLocations();
    } catch (_) { status.textContent = 'Visitor statistics are temporarily unavailable. Please try again later.'; shortcut.textContent = 'View map'; }
  }
  function loadMap() {
    if (mapPromise) return mapPromise;
    mapPromise = new Promise((resolve, reject) => {
      if (window.T?.Map) { resolve(); return; }
      const script = document.createElement('script');
      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${encodeURIComponent(config.mapKey)}`;
      script.referrerPolicy = 'origin'; script.async = true;
      const timeout = setTimeout(() => reject(new Error('Map timeout')), 18000);
      script.onload = () => { clearTimeout(timeout); window.T?.Map ? resolve() : reject(new Error('Map not available')); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Map unavailable')); };
      document.head.append(script);
    }).then(() => {
      document.getElementById('visitor-map').replaceChildren();
      const tileUrl = layer => `https://t0.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${encodeURIComponent(config.mapKey)}`;
      const base = new T.TileLayer(tileUrl('vec'), { minZoom:1, maxZoom:8 });
      const labels = new T.TileLayer(tileUrl('cva'), { minZoom:1, maxZoom:8 });
      map = new T.Map('visitor-map', { layers:[base, labels], minZoom:1, maxZoom:8 });
      map.centerAndZoom(new T.LngLat(105,25),1);
      map.disableScrollWheelZoom(); map.addControl(new T.Control.Zoom());
      mapStatus.textContent = 'TianDiTu · Drag to explore; use + / − to zoom.';
      drawLocations();
    }).catch(() => {
      mapStatus.textContent = 'The map could not be loaded. Available visitor locations are listed below.';
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

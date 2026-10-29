(() => {
  'use strict';
  const config = window.HOMEPAGE_VISITORS;
  const section = document.getElementById('visitors');
  if (!config || !section) return;
  const status = document.getElementById('visitor-status');
  const mapStatus = document.getElementById('visitor-map-status');
  const shortcut = document.getElementById('visitor-shortcut-count');
  const number = new Intl.NumberFormat('en');
  let mapPromise, visitorMap, visitorMarkers;
  let locations = [];
  const regions = new Intl.DisplayNames(['en'], {type:'region'});
  function locationName(place) {
    let country = place.country;
    try { country = regions.of(place.country); } catch (_) {}
    return [place.city, country].filter(Boolean).join(', ');
  }
  function drawVisitorMarkers() {
    if (!visitorMap) return;
    visitorMarkers.clearLayers();
    const center = visitorMap.getCenter().lng;
    for (const place of locations) {
      const longitude = place.longitude + 360 * Math.round((center - place.longitude) / 360);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = locationName(place);
      popup.append(title, document.createElement('br'), `${number.format(place.visits)} visits · Approximate city location`);
      L.circleMarker([place.latitude,longitude], {radius:Math.min(15,5+Math.log2(1+place.visits)*2),color:'#8b4d2c',weight:1.5,fillColor:'#c47e51',fillOpacity:0.65})
        .bindPopup(popup).addTo(visitorMarkers);
    }
  }
  // Local English names over the unchanged TianDiTu basemap. No visitor data.
  // The provider's legacy English annotation endpoint currently returns no tiles.
  const places = [
    ['China',36,103], ['United States',38,-101], ['Russia',62,97],
    ['Canada',59,-110], ['Australia',-25,134], ['Brazil',-11,-52],
    ['India',22,79], ['South Africa',-29,25], ['Argentina',-36,-65],
    ['Mexico',24,-103], ['Japan',37,139], ['Indonesia',-3,118],
    ['United Kingdom',55,-3], ['France',47,2], ['Germany',51,10],
    ['Egypt',27,30], ['Saudi Arabia',24,45], ['Iran',32,54],
    ['Kazakhstan',48,67], ['Mongolia',47,104], ['Türkiye',39,35],
    ['Algeria',28,3], ['Nigeria',9,8], ['Kenya',0,38],
    ['DR Congo',-3,23], ['Madagascar',-19,47], ['New Zealand',-42,173],
    ['Chile',-33,-71], ['Peru',-10,-75], ['Colombia',5,-74],
    ['Venezuela',8,-66], ['Greenland',72,-41], ['Iceland',65,-19],
    ['Norway',65,13], ['Sweden',63,17], ['Finland',64,26],
    ['Spain',40,-4], ['Italy',43,12], ['Poland',52,19],
    ['Greece',39,23], ['Ukraine',49,32], ['Pakistan',30,69],
    ['Thailand',16,101], ['Vietnam',17,107], ['Philippines',12,123],
    ['Malaysia',4,102], ['South Korea',36,128], ['Bangladesh',24,90],
    ['Myanmar',21,96], ['Afghanistan',34,66], ['Uzbekistan',41,64],
    ['Morocco',32,-6], ['Ethiopia',9,40], ['Tanzania',-6,35],
    ['Angola',-12,18], ['Zambia',-14,28], ['Mozambique',-18,35],
    ['Sudan',16,30], ['Libya',27,18], ['Chad',15,19],
    ['Niger',17,9], ['Mali',17,-4], ['Mauritania',20,-11],
    ['Namibia',-22,17], ['Botswana',-22,24], ['Papua New Guinea',-6,145],
    ['Cuba',22,-79], ['Ecuador',-2,-78], ['Bolivia',-17,-64],
    ['Paraguay',-23,-58], ['Uruguay',-33,-56],
    ['Pacific Ocean',5,-150,'ocean'], ['Atlantic Ocean',10,-30,'ocean'],
    ['Indian Ocean',-24,78,'ocean'], ['Arctic Ocean',79,155,'ocean']
  ];
  function addEnglishLabels(map) {
    const labels = L.layerGroup().addTo(map);
    function draw() {
      labels.clearLayers();
      const size = map.getSize();
      const center = map.getCenter().lng;
      const occupied = [];
      for (const [name, lat, lng, type] of places) {
        const wrapped = lng + 360 * Math.round((center - lng) / 360);
        const point = map.latLngToContainerPoint([lat, wrapped]);
        const width = name.length * 6.7 + 10;
        const box = { x:point.x-width/2, y:point.y-10, w:width, h:20 };
        if (box.x < 6 || box.x+box.w > size.x-6 || box.y < 6 || box.y+box.h > size.y-22) continue;
        if (occupied.some(b => box.x < b.x+b.w+5 && box.x+box.w+5 > b.x && box.y < b.y+b.h+5 && box.y+box.h+5 > b.y)) continue;
        occupied.push(box);
        const text = document.createElement('span');
        text.textContent = name;
        text.className = type === 'ocean' ? 'map-label-ocean' : 'map-label-country';
        L.marker([lat,wrapped], { interactive:false, keyboard:false,
          icon:L.divIcon({className:'map-english-label', html:text, iconSize:[width,20], iconAnchor:[width/2,10]})
        }).addTo(labels);
      }
    }
    map.on('moveend zoomend resize', draw);
    draw();
  }
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
      locations = Array.isArray(data.locations) ? data.locations.filter(p =>
        typeof p.city === 'string' && /^[A-Z]{2}$/.test(p.country) &&
        Number.isFinite(p.latitude) && Math.abs(p.latitude)<=90 &&
        Number.isFinite(p.longitude) && Math.abs(p.longitude)<=180 && p.visits>0) : [];
      status.textContent = data.geolocation
        ? `${number.format(data.locatedVisits || 0)} visits mapped to approximate cities · ${number.format(data.unlocatedVisits || 0)} without a known location.`
        : 'Aggregate visit count · Location tracking is disabled.';
      const citySummary = document.getElementById('visitor-city-summary');
      if (citySummary) {
        citySummary.hidden = !data.geolocation;
        const list = document.getElementById('visitor-locations');
        list.replaceChildren();
        for (const place of locations.slice(0,8)) {
          const row = document.createElement('li');
          const name = document.createElement('span'); name.textContent = locationName(place);
          const count = document.createElement('span'); count.textContent = number.format(place.visits);
          row.append(name,count); list.append(row);
        }
        document.getElementById('visitor-location-empty').hidden = locations.length>0;
      }
      drawVisitorMarkers();
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
      visitorMap = map;
      visitorMarkers = L.layerGroup().addTo(map);
      map.on('moveend', drawVisitorMarkers);
      const base = L.tileLayer(tileUrl('vec'), { minZoom:0, minNativeZoom:1, maxZoom:8, attribution:'&copy; <a href="https://www.tianditu.gov.cn/">TianDiTu 天地图</a> · GS(2026)4921号 · 甲测资字11110974' }).addTo(map);
      addEnglishLabels(map);
      drawVisitorMarkers();
      mapStatus.textContent = 'Loading TianDiTu basemap…';
      base.on('tileload', () => { mapStatus.textContent = 'TianDiTu basemap · English country labels · Drag to explore; use + / − to zoom.'; });
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

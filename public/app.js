/* global L */
const $ = (sel) => document.querySelector(sel);

const state = {
  map: null,
  markers: [],
  limit: 100,
};

function setStatus(msg) {
  const el = $("#status");
  if (el) el.textContent = msg;
}

function setWeatherBox(contentHtml, empty = false) {
  const box = $("#weatherBox");
  if (!box) return;
  box.classList.toggle("empty", empty);
  box.innerHTML = contentHtml;
}

async function fetchHotspots(limit) {
  const url = new URL(location.origin + "/api/hotspots");
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch hotspots");
  return res.json();
}

async function fetchWeather(lat, lon) {
  const url = new URL(location.origin + "/api/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

function clearMarkers() {
  for (const m of state.markers) m.remove();
  state.markers = [];
}

function addHotspotMarker(point) {
  const marker = L.circleMarker([point.lat, point.lon], {
    radius: 6,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.9,
    weight: 1,
  });
  marker.bindTooltip(`Lat ${point.lat.toFixed(3)}, Lon ${point.lon.toFixed(3)}${point.confidence ? `, conf ${point.confidence}`: ''}`);
  marker.on('click', async () => {
    setWeatherBox(`<div>Loading weather...</div>`);
    try {
      const w = await fetchWeather(point.lat, point.lon);
      const wind = w.windSpeedMs != null ? `${w.windSpeedMs} m/s` : 'n/a';
      const desc = w.description ?? 'n/a';
      const html = `
        <div class="wb-row"><strong>Location:</strong> ${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}</div>
        <div class="wb-row"><strong>Temp:</strong> ${w.tempC.toFixed(1)} °C</div>
        <div class="wb-row"><strong>Wind:</strong> ${wind}${w.windDeg != null ? ` @ ${w.windDeg}°` : ''}</div>
        <div class="wb-row"><strong>Humidity:</strong> ${w.humidity ?? 'n/a'}%</div>
        <div class="wb-row"><strong>Conditions:</strong> ${desc}</div>
      `;
      setWeatherBox(html);
    } catch (err) {
      console.error(err);
      setWeatherBox(`<div style="color:#f87171">Failed to fetch weather</div>`);
    }
  });
  marker.addTo(state.map);
  state.markers.push(marker);
}

async function refreshHotspots() {
  setStatus('Loading hotspots...');
  setWeatherBox('Click a marker to see current weather', true);
  clearMarkers();
  try {
    const data = await fetchHotspots(state.limit);
    const bounds = L.latLngBounds();
    for (const p of data.points) {
      addHotspotMarker(p);
      bounds.extend([p.lat, p.lon]);
    }
    if (data.points.length > 0) {
      state.map.fitBounds(bounds.pad(0.2));
      setStatus(`Showing ${data.count} hotspots`);
    } else {
      setStatus('No hotspots found');
    }
  } catch (err) {
    console.error(err);
    setStatus('Failed to load hotspots');
  }
}

function initUI() {
  const limitInput = $("#limitInput");
  const refreshBtn = $("#refreshBtn");
  if (limitInput) {
    limitInput.addEventListener('change', () => {
      const v = Number(limitInput.value);
      if (Number.isFinite(v)) state.limit = Math.max(10, Math.min(200, v));
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshHotspots);
  }
}

function initMap() {
  state.map = L.map('map', {
    center: [20, 0],
    zoom: 2,
    worldCopyJump: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(state.map);
}

window.addEventListener('DOMContentLoaded', async () => {
  initMap();
  initUI();
  await refreshHotspots();
});

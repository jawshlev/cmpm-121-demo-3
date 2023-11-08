import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 0.0001; // Change to 0.0001 degrees
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1; // 10% probability

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
});

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function generateCoins() {
  return Math.floor(Math.random() * 100);
}

function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [
      MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + j * TILE_DEGREES,
    ],
    [
      MERRILL_CLASSROOM.lat + (i + 1) * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + (j + 1) * TILE_DEGREES,
    ],
  ]);

  const cache = leaflet.rectangle(bounds) as leaflet.Layer;

  cache.bindPopup(() => {
    let coins = generateCoins();
    const container = document.createElement("div");
    container.innerHTML = `
            <div>This cache is located at "${i},${j}". It contains ${coins} coins.</div>
            <button id="collect">Collect Coins</button>
            <button id="deposit">Deposit Coins</button>`;
    const collectButton =
      container.querySelector<HTMLButtonElement>("#collect")!;
    const depositButton =
      container.querySelector<HTMLButtonElement>("#deposit")!;

    collectButton.addEventListener("click", () => {
      points += coins;
      statusPanel.innerHTML = `${points} points accumulated`;
      cache.closePopup();
    });

    depositButton.addEventListener("click", () => {
      if (coins > 0) {
        coins--;
        statusPanel.innerHTML = `${points} points accumulated`;
      }
      cache.closePopup();
    });

    return container;
  });

  cache.addTo(map);
}

// Generate cache locations around the player's initial location
for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j++) {
    if (
      Math.abs(i) + Math.abs(j) <= NEIGHBORHOOD_SIZE &&
      luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY
    ) {
      makePit(i, j);
    }
  }
}

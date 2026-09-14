import { useCallback, useEffect, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./DisasterMap.css";

// =====================================================
// MAP TILE CONFIGURATION
// =====================================================

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_CACHE_NAME = "disaster-map-tiles-v1";

const OFFLINE_RADIUS_KM = 2;

// Download these zoom levels for the 2 KM area
const DOWNLOAD_ZOOMS = [14, 15, 16];


// =====================================================
// USER LOCATION ICON
// =====================================================

const userIcon = L.divIcon({
  className: "custom-map-icon",
  html: `
    <div class="user-location-marker">
      📍
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});


// =====================================================
// SAFE LOCATION ICON
// =====================================================

const shelterIcon = L.divIcon({
  className: "custom-map-icon",
  html: `
    <div class="shelter-location-marker">
      🏠
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});


// =====================================================
// SAFEST LOCATION ICON
// =====================================================

const safestIcon = L.divIcon({
  className: "custom-map-icon",
  html: `
    <div class="safest-location-marker">
      🛡️
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});


// =====================================================
// MAP CONTROLLER
// =====================================================

function MapController({ location }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.flyTo(
      [
        Number(location.latitude),
        Number(location.longitude),
      ],
      15,
      {
        duration: 1.2,
      }
    );
  }, [location, map]);

  return null;
}


// =====================================================
// DISTANCE CALCULATION
// =====================================================

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


// =====================================================
// GET TILE RANGE FOR 2 KM AREA
// =====================================================

function latLonToTile(lat, lon, zoom) {
  const latRad =
    (lat * Math.PI) / 180;

  const n = Math.pow(2, zoom);

  const x =
    Math.floor(
      ((lon + 180) / 360) * n
    );

  const y =
    Math.floor(
      (
        (1 -
          Math.asinh(Math.tan(latRad)) /
            Math.PI) /
        2
      ) * n
    );

  return {
    x,
    y,
  };
}


// =====================================================
// CREATE TILE URL
// =====================================================

function createTileUrl(x, y, z) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}


// =====================================================
// GET TILES AROUND LOCATION
// =====================================================

function getTilesAroundLocation(
  latitude,
  longitude,
  zoom
) {
  const latDelta =
    OFFLINE_RADIUS_KM / 111;

  const lonDelta =
    OFFLINE_RADIUS_KM /
    (111 *
      Math.cos(
        (latitude * Math.PI) / 180
      ));

  const minLat =
    latitude - latDelta;

  const maxLat =
    latitude + latDelta;

  const minLon =
    longitude - lonDelta;

  const maxLon =
    longitude + lonDelta;

  const topLeft = latLonToTile(
    maxLat,
    minLon,
    zoom
  );

  const bottomRight = latLonToTile(
    minLat,
    maxLon,
    zoom
  );

  const tiles = [];

  const maxTile =
    Math.pow(2, zoom) - 1;

  const minX = Math.max(
    0,
    topLeft.x
  );

  const maxX = Math.min(
    maxTile,
    bottomRight.x
  );

  const minY = Math.max(
    0,
    topLeft.y
  );

  const maxY = Math.min(
    maxTile,
    bottomRight.y
  );

  for (
    let x = minX;
    x <= maxX;
    x++
  ) {
    for (
      let y = minY;
      y <= maxY;
      y++
    ) {
      tiles.push({
        x,
        y,
        z: zoom,
        url: createTileUrl(
          x,
          y,
          zoom
        ),
      });
    }
  }

  return tiles;
}


// =====================================================
// DISASTER MAP COMPONENT
// =====================================================

function DisasterMap({
  userLocation,
  shelters = [],
  safestLocations = [],
  selectedShelter,
  onShelterClick,
}) {

  // ---------------------------------------------------
  // ONLINE / OFFLINE STATE
  // ---------------------------------------------------

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );


  // ---------------------------------------------------
  // DOWNLOAD STATE
  // ---------------------------------------------------

  const [downloadState, setDownloadState] =
    useState("idle");

  const [downloadProgress, setDownloadProgress] =
    useState(0);

  const [downloadedTiles, setDownloadedTiles] =
    useState(0);

  const [totalTiles, setTotalTiles] =
    useState(0);


  // ---------------------------------------------------
  // SAVED MAP INFORMATION
  // ---------------------------------------------------

  const [offlineMapInfo, setOfflineMapInfo] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "offlineMapInfo"
          );

        return saved
          ? JSON.parse(saved)
          : null;
      } catch {
        return null;
      }
    });


  // ---------------------------------------------------
  // PREVENT REPEATED AUTO DOWNLOAD
  // ---------------------------------------------------

  const autoDownloadKeyRef =
    useRef("");


  // ===================================================
  // ONLINE / OFFLINE LISTENERS
  // ===================================================

  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, []);


  // ===================================================
  // DOWNLOAD OFFLINE MAP
  // ===================================================

  const downloadOfflineMap =
    useCallback(async () => {

      if (!userLocation) {
        return;
      }

      if (!navigator.onLine) {
        setDownloadState("error");
        return;
      }

      if (
        !("caches" in window)
      ) {
        console.error(
          "Cache API is not supported."
        );

        setDownloadState("error");
        return;
      }

      try {

        setDownloadState(
          "downloading"
        );

        setDownloadProgress(0);

        setDownloadedTiles(0);

        // ---------------------------------------------
        // OPEN TILE CACHE
        // ---------------------------------------------

        const cache =
          await caches.open(
            TILE_CACHE_NAME
          );


        // ---------------------------------------------
        // GET USER LOCATION
        // ---------------------------------------------

        const latitude =
          Number(
            userLocation.latitude
          );

        const longitude =
          Number(
            userLocation.longitude
          );


        // ---------------------------------------------
        // CREATE TILE LIST
        // ---------------------------------------------

        let allTiles = [];

        DOWNLOAD_ZOOMS.forEach(
          (zoom) => {

            const tiles =
              getTilesAroundLocation(
                latitude,
                longitude,
                zoom
              );

            allTiles = [
              ...allTiles,
              ...tiles,
            ];

          }
        );


        // Remove duplicates

        const uniqueTiles =
          Array.from(
            new Map(
              allTiles.map(
                (tile) => [
                  tile.url,
                  tile,
                ]
              )
            ).values()
          );


        setTotalTiles(
          uniqueTiles.length
        );


        // ---------------------------------------------
        // DOWNLOAD TILES
        // ---------------------------------------------

        let completed = 0;

        const concurrency = 6;

        let currentIndex = 0;


        const downloadTile =
          async () => {

            while (
              currentIndex <
              uniqueTiles.length
            ) {

              const index =
                currentIndex++;

              const tile =
                uniqueTiles[index];

              try {

                const existing =
                  await cache.match(
                    tile.url
                  );

                if (!existing) {

                  const response =
                    await fetch(
                      tile.url,
                      {
                        mode: "cors",
                      }
                    );

                  if (
                    response.ok
                  ) {

                    await cache.put(
                      tile.url,
                      response.clone()
                    );

                  }

                }

              } catch (error) {

                console.warn(
                  "Could not cache tile:",
                  tile.url,
                  error
                );

              }


              completed++;

              setDownloadedTiles(
                completed
              );

              setDownloadProgress(
                Math.round(
                  (completed /
                    uniqueTiles.length) *
                    100
                )
              );

            }

          };


        // ---------------------------------------------
        // RUN DOWNLOAD WORKERS
        // ---------------------------------------------

        const workers = [];

        const workerCount =
          Math.min(
            concurrency,
            uniqueTiles.length
          );

        for (
          let i = 0;
          i < workerCount;
          i++
        ) {

          workers.push(
            downloadTile()
          );

        }

        await Promise.all(
          workers
        );


        // ---------------------------------------------
        // SAVE MAP INFORMATION
        // ---------------------------------------------

        const mapInfo = {

          latitude,

          longitude,

          radiusKm:
            OFFLINE_RADIUS_KM,

          zooms:
            DOWNLOAD_ZOOMS,

          downloadedTiles:
            completed,

          downloadedAt:
            new Date().toISOString(),

        };


        localStorage.setItem(
          "offlineMapInfo",
          JSON.stringify(mapInfo)
        );


        setOfflineMapInfo(
          mapInfo
        );

        setDownloadProgress(
          100
        );

        setDownloadState(
          "downloaded"
        );


      } catch (error) {

        console.error(
          "Offline map download failed:",
          error
        );

        setDownloadState(
          "error"
        );

      }

    }, [userLocation]);


  // ===================================================
  // AUTOMATIC MAP DOWNLOAD
  // ===================================================

  useEffect(() => {

    if (
      !isOnline ||
      !userLocation
    ) {
      return;
    }


    const latitude =
      Number(
        userLocation.latitude
      );

    const longitude =
      Number(
        userLocation.longitude
      );


    // Round location so tiny GPS changes
    // don't trigger a new download

    const locationKey =
      `${latitude.toFixed(
        2
      )}_${longitude.toFixed(2)}`;


    if (
      autoDownloadKeyRef.current ===
      locationKey
    ) {
      return;
    }


    autoDownloadKeyRef.current =
      locationKey;


    // Automatically download map
    // around user's location

    downloadOfflineMap();

  }, [
    isOnline,
    userLocation,
    downloadOfflineMap,
  ]);


  // ===================================================
  // LOADING STATE
  // ===================================================

  if (!userLocation) {

    return (
      <div className="map-loading">

        <div className="map-loading-icon">
          📍
        </div>

        <h3>
          Getting your location...
        </h3>

        <p>
          Please allow location access.
        </p>

      </div>
    );

  }


  // ===================================================
  // USER POSITION
  // ===================================================

  const userPosition = [

    Number(
      userLocation.latitude
    ),

    Number(
      userLocation.longitude
    ),

  ];


  // ===================================================
  // SELECTED SHELTER ROUTE
  // ===================================================

  let route = [];


  if (
    selectedShelter &&
    selectedShelter.latitude != null &&
    selectedShelter.longitude != null
  ) {

    route = [

      userPosition,

      [
        Number(
          selectedShelter.latitude
        ),

        Number(
          selectedShelter.longitude
        ),
      ],

    ];

  }


  // ===================================================
  // FILTER SAFE LOCATIONS
  // ===================================================

  const validShelters =
    shelters.filter(
      (shelter) =>
        shelter.latitude != null &&
        shelter.longitude != null
    );


  // ===================================================
  // FILTER SAFEST LOCATIONS
  // ===================================================

  const validSafestLocations =
    safestLocations.filter(
      (location) =>
        location.latitude != null &&
        location.longitude != null
    );


  // ===================================================
  // OFFLINE MAP AVAILABLE?
  // ===================================================

  const hasOfflineMap =
    Boolean(
      offlineMapInfo
    );


  // ===================================================
  // MAP STATUS TEXT
  // ===================================================

  let mapStatusText =
    "Online • Map connected";


  if (!isOnline) {

    mapStatusText =
      hasOfflineMap
        ? "Offline • Cached map"
        : "Offline • Map not downloaded";

  } else if (
    downloadState === "downloading"
  ) {

    mapStatusText =
      "Online • Downloading map...";

  } else if (
    downloadState === "downloaded" ||
    hasOfflineMap
  ) {

    mapStatusText =
      "Online • Offline map ready";

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="disaster-map-wrapper">

      {/* =============================================
          MAP HEADER
      ============================================== */}

      <div className="map-top-controls">

        <div
          className={`map-status ${
            isOnline
              ? "map-status-online"
              : "map-status-offline"
          }`}
        >

          <span className="status-dot"></span>

          {mapStatusText}

        </div>


        {/* DOWNLOAD BUTTON */}

        <button
          type="button"
          className="map-download-button"
          onClick={
            downloadOfflineMap
          }
          disabled={
            !isOnline ||
            downloadState ===
              "downloading"
          }
        >

          {downloadState ===
          "downloading"
            ? `⬇️ Downloading ${downloadProgress}%`
            : "⬇️ Download 2 KM Offline Map"}

        </button>

      </div>


      {/* =============================================
          DOWNLOAD PROGRESS
      ============================================== */}

      {downloadState ===
        "downloading" && (

        <div className="map-download-progress">

          <div className="progress-bar-background">

            <div
              className="progress-bar-fill"
              style={{
                width: `${downloadProgress}%`,
              }}
            />

          </div>

          <span>
            Downloading map tiles...
            {" "}
            {downloadedTiles}
            /
            {totalTiles}
          </span>

        </div>

      )}


      {/* =============================================
          DOWNLOAD SUCCESS
      ============================================== */}

      {downloadState ===
        "downloaded" && (

        <div className="map-download-success">

          ✅ 2 KM offline map saved on
          this device.

        </div>

      )}


      {/* =============================================
          DOWNLOAD ERROR
      ============================================== */}

      {downloadState ===
        "error" && (

        <div className="map-download-error">

          ⚠️ Unable to download all map
          tiles. Please try again while
          connected to the internet.

        </div>

      )}


      {/* =============================================
          OFFLINE LOCATION
      ============================================== */}

      {!isOnline && (

        <div className="offline-location-info">

          <div>
            📍 <strong>Last known location</strong>
          </div>

          <span>

            {Number(
              userLocation.latitude
            ).toFixed(5)}

            {" , "}

            {Number(
              userLocation.longitude
            ).toFixed(5)}

          </span>

        </div>

      )}


      {/* =============================================
          MAP
      ============================================== */}

      <div className="disaster-map-container">

        <MapContainer
          center={userPosition}
          zoom={15}
          minZoom={10}
          maxZoom={
            isOnline ? 18 : 16
          }
          scrollWheelZoom={true}
          className="disaster-map"
        >

          {/* =========================================
              MAP TILES
          ========================================= */}

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url={TILE_URL}
          />


          {/* =========================================
              MAP CONTROLLER
          ========================================= */}

          <MapController
            location={
              selectedShelter
                ? {
                    latitude:
                      selectedShelter.latitude,

                    longitude:
                      selectedShelter.longitude,
                  }
                : userLocation
            }
          />


          {/* =========================================
              USER LOCATION
          ========================================= */}

          <Marker
            position={userPosition}
            icon={userIcon}
          >

            <Popup>

              <div className="map-popup">

                <strong>
                  📍 Your Location
                </strong>

                <br />

                Latitude:
                {" "}
                {Number(
                  userLocation.latitude
                ).toFixed(6)}

                <br />

                Longitude:
                {" "}
                {Number(
                  userLocation.longitude
                ).toFixed(6)}

                {!isOnline && (

                  <p className="popup-offline">

                    🔴 Last saved location

                  </p>

                )}

              </div>

            </Popup>

          </Marker>


          {/* =========================================
              2 KM RADIUS
          ========================================= */}

          <Circle
            center={userPosition}
            radius={2000}
            pathOptions={{
              fillOpacity: 0.08,
              weight: 2,
            }}
          />


          {/* =========================================
              SAFEST LOCATIONS
          ========================================= */}

          {validSafestLocations.map(
            (location, index) => {

              const locationId =
                location.id ??
                `safest-${index}`;


              return (

                <Marker
                  key={`safest-${locationId}`}
                  position={[
                    Number(
                      location.latitude
                    ),
                    Number(
                      location.longitude
                    ),
                  ]}
                  icon={safestIcon}
                  eventHandlers={{
                    click: () => {

                      if (
                        onShelterClick
                      ) {

                        onShelterClick(
                          location
                        );

                      }

                    },
                  }}
                >

                  <Popup>

                    <div className="map-popup safest-popup">

                      <div className="popup-title">

                        🛡️
                        {" "}
                        <strong>
                          Recommended Safest
                          Location
                        </strong>

                      </div>

                      <hr />

                      <strong>

                        {location.name ||
                          location.locationName ||
                          "Safest Location"}

                      </strong>

                      {location.address && (

                        <>
                          <br />
                          {location.address}
                        </>

                      )}

                      {location.capacity != null && (

                        <>
                          <br />
                          👥 Capacity:
                          {" "}
                          {location.capacity}
                        </>

                      )}

                      {location.elevation != null && (

                        <>
                          <br />
                          ⛰️ Elevation:
                          {" "}
                          {location.elevation}
                          {" m"}
                        </>

                      )}

                      {location.heatSafetyScore != null && (

                        <>
                          <br />
                          ☀️ Heat Safety Score:
                          {" "}
                          {location.heatSafetyScore}
                        </>

                      )}

                      <div className="popup-recommended">

                        ⭐ Recommended for
                        emergency safety

                      </div>

                    </div>

                  </Popup>

                </Marker>

              );

            }
          )}


          {/* =========================================
              NORMAL SAFE LOCATIONS
          ========================================= */}

          {validShelters.map(
            (shelter, index) => {

              const shelterId =
                shelter.id ??
                `shelter-${index}`;


              return (

                <Marker
                  key={`shelter-${shelterId}`}
                  position={[
                    Number(
                      shelter.latitude
                    ),
                    Number(
                      shelter.longitude
                    ),
                  ]}
                  icon={shelterIcon}
                  eventHandlers={{
                    click: () => {

                      if (
                        onShelterClick
                      ) {

                        onShelterClick(
                          shelter
                        );

                      }

                    },
                  }}
                >

                  <Popup>

                    <div className="map-popup">

                      <strong>
                        🏠
                        {" "}
                        {shelter.name ||
                          shelter.locationName ||
                          "Safe Location"}
                      </strong>

                      {shelter.address && (

                        <>
                          <br />
                          {shelter.address}
                        </>

                      )}

                      {shelter.capacity != null && (

                        <>
                          <br />
                          👥 Capacity:
                          {" "}
                          {shelter.capacity}
                        </>

                      )}

                      <br />

                      {shelter.floodSafe
                        ? "✅ Flood Safe"
                        : "⚠️ Check Safety"}

                    </div>

                  </Popup>

                </Marker>

              );

            }
          )}


          {/* =========================================
              ROUTE TO SELECTED LOCATION
          ========================================= */}

          {route.length === 2 && (

            <Polyline
              positions={route}
              pathOptions={{
                weight: 5,
                dashArray: "10 10",
              }}
            />

          )}

        </MapContainer>

      </div>


      {/* =============================================
          MAP LEGEND
      ============================================== */}

      <div className="map-legend">

        <div className="legend-title">
          Map Legend
        </div>


        <div className="legend-items">

          <div className="legend-item">

            <span className="legend-icon">
              📍
            </span>

            <span>
              Your Location
            </span>

          </div>


          <div className="legend-item">

            <span className="legend-icon">
              🛡️
            </span>

            <span>
              Safest Location
            </span>

          </div>


          <div className="legend-item">

            <span className="legend-icon">
              🏠
            </span>

            <span>
              Safe Location
            </span>

          </div>

        </div>

      </div>


      {/* =============================================
          OFFLINE INFORMATION
      ============================================== */}

      {!isOnline && (

        <div className="offline-map-message">

          <span className="offline-map-icon">
            📡
          </span>

          <div>

            <strong>
              Offline Map Mode
            </strong>

            <p>

              Internet is unavailable.
              The app is using your saved
              location and cached map tiles.

            </p>

            {!hasOfflineMap && (

              <p className="offline-warning">

                ⚠️ No offline map has been
                downloaded yet. Map tiles may
                not be visible.

              </p>

            )}

          </div>

        </div>

      )}


      {/* =============================================
          LAST MAP DOWNLOAD
      ============================================== */}

      {hasOfflineMap && (

        <div className="offline-map-info">

          <span>
            💾
          </span>

          <div>

            <strong>
              Offline map available
            </strong>

            <small>

              {offlineMapInfo.downloadedTiles}
              {" "}
              map tiles saved
              {" • "}
              2 KM coverage

            </small>

          </div>

        </div>

      )}

    </div>

  );

}


// =====================================================
// EXPORT
// =====================================================

export default DisasterMap;
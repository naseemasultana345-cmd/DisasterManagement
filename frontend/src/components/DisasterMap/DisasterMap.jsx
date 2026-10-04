import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";

import L from "leaflet";

import { Download } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./DisasterMap.css";

// =====================================================
// CONFIGURATION
// =====================================================

const TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const TILE_CACHE_NAME =
  "disaster-map-tiles-v2";

const OFFLINE_RADIUS_KM = 2;

const MAX_LOCATION_DISTANCE_KM = 2;

const DOWNLOAD_ZOOMS = [
  14,
  15,
  16,
];

// =====================================================
// REAL ROAD ROUTING
// =====================================================

const OSRM_URL =
  "https://router.project-osrm.org/route/v1/driving";

const ROUTE_CACHE_PREFIX =
  "disaster-road-route-";

// =====================================================
// USER ICON
// =====================================================

const userIcon = L.divIcon({

  className:
    "custom-map-icon",

  html: `
    <div class="user-location-marker">
      <span></span>
    </div>
  `,

  iconSize: [
    42,
    42,
  ],

  iconAnchor: [
    21,
    42,
  ],

  popupAnchor: [
    0,
    -42,
  ],

});

// =====================================================
// SAFE LOCATION ICON
// =====================================================

const shelterIcon = L.divIcon({

  className:
    "custom-map-icon",

  html: `
    <div class="shelter-location-marker">
      🏠
    </div>
  `,

  iconSize: [
    42,
    42,
  ],

  iconAnchor: [
    21,
    42,
  ],

  popupAnchor: [
    0,
    -42,
  ],

});

// =====================================================
// HOSPITAL ICON
// =====================================================

const hospitalIcon = L.divIcon({

  className:
    "custom-map-icon",

  html: `
    <div class="hospital-location-marker">
      ✚
    </div>
  `,

  iconSize: [
    42,
    42,
  ],

  iconAnchor: [
    21,
    42,
  ],

  popupAnchor: [
    0,
    -42,
  ],

});

// =====================================================
// SAFEST LOCATION ICON
// =====================================================

const safestIcon = L.divIcon({

  className:
    "custom-map-icon",

  html: `
    <div class="safest-location-marker">
      🏠
    </div>
  `,
  iconSize: [
    44,
    44,
  ],

  iconAnchor: [
    22,
    44,
  ],

  popupAnchor: [
    0,
    -44,
  ],

});

// =====================================================
// FOOD SERVICE ICON
// =====================================================

const foodServiceIcon =
  L.divIcon({

    className:
      "custom-map-icon",

    html: `
      <div class="food-service-marker">
        🍱
      </div>
    `,

    iconSize: [
      42,
      42,
    ],

    iconAnchor: [
      21,
      42,
    ],

    popupAnchor: [
      0,
      -42,
    ],

  });

// =====================================================
// POLICE SERVICE ICON
// =====================================================

const policeServiceIcon =
  L.divIcon({

    className:
      "custom-map-icon",

    html: `
      <div class="police-service-marker">
        👮
      </div>
    `,

    iconSize: [
      42,
      42,
    ],

    iconAnchor: [
      21,
      42,
    ],

    popupAnchor: [
      0,
      -42,
    ],

  });

// =====================================================
// MAP CONTROLLER
// =====================================================

function MapController({
  location,
  offlineMode,
  shelters,
  selectedShelter,
}) {

  const map =
    useMap();

  const hasFittedInitialView =
    useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {

    if (!location) {
      return;
    }

    const latitude =
      Number(
        location.latitude
      );

    const longitude =
      Number(
        location.longitude
      );

    if (
      Number.isNaN(
        latitude
      ) ||
      Number.isNaN(
        longitude
      )
    ) {
      return;
    }

    if (
      selectedShelter &&
      selectedShelter.latitude != null &&
      selectedShelter.longitude != null
    ) {
      const selectedLatitude =
        Number(
          selectedShelter.latitude
        );

      const selectedLongitude =
        Number(
          selectedShelter.longitude
        );

      if (
        !Number.isNaN(
          selectedLatitude
        ) &&
        !Number.isNaN(
          selectedLongitude
        )
      ) {
        map.flyTo(
          [
            selectedLatitude,
            selectedLongitude,
          ],
          offlineMode ? 16 : 15,
          {
            duration: 1.2,
          }
        );

        return;
      }
    }

    if (!hasFittedInitialView.current) {

      const points = [
        [
          latitude,
          longitude,
        ],
      ];

      (shelters || []).forEach(
        (shelter) => {
          const shelterLatitude =
            Number(
              shelter.latitude
            );

          const shelterLongitude =
            Number(
              shelter.longitude
            );

          if (
            !Number.isNaN(
              shelterLatitude
            ) &&
            !Number.isNaN(
              shelterLongitude
            )
          ) {
            points.push([
              shelterLatitude,
              shelterLongitude,
            ]);
          }
        }
      );

      if (points.length > 1) {
        map.fitBounds(
          L.latLngBounds(points),
          {
            padding: [
              45,
              45,
            ],
            maxZoom: offlineMode
              ? 16
              : 15,
            animate: true,
          }
        );
      } else {
        map.flyTo(
          [
            latitude,
            longitude,
          ],
          offlineMode ? 16 : 15,
          {
            duration: 1.2,
          }
        );
      }

      hasFittedInitialView.current =
        true;

      return;
    }

    map.flyTo(
      [
        latitude,
        longitude,
      ],
      offlineMode ? 16 : 15,
      {
        duration: 1.2,
      }
    );

  }, [
    location,
    map,
    offlineMode,
    shelters,
    selectedShelter,
  ]);

  return null;
}

// =====================================================
// ROUTE MAP CONTROLLER
// =====================================================

function RouteMapController({
  route,
}) {

  const map =
    useMap();

  useEffect(() => {

    if (
      !route ||
      route.length < 2
    ) {
      return;
    }

    try {

      const bounds =
        L.latLngBounds(
          route
        );

      map.fitBounds(
        bounds,
        {
          padding: [
            50,
            50,
          ],

          maxZoom: 17,

          animate: true,
        }
      );

    } catch (error) {

      console.error(
        "Unable to fit route on map:",
        error
      );

    }

  }, [
    route,
    map,
  ]);

  return null;
}

// =====================================================
// DISTANCE
// =====================================================

function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R =
    6371;

  const dLat =
    (
      (lat2 - lat1) *
      Math.PI
    ) / 180;

  const dLon =
    (
      (lon2 - lon1) *
      Math.PI
    ) / 180;

  const a =
    Math.sin(
      dLat / 2
    ) *
      Math.sin(
        dLat / 2
      ) +

    Math.cos(
      (lat1 * Math.PI) /
        180
    ) *

      Math.cos(
        (lat2 * Math.PI) /
          180
      ) *

      Math.sin(
        dLon / 2
      ) *

      Math.sin(
        dLon / 2
      );

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a
      )
    );

  return R * c;
}

// =====================================================
// CHECK LOCATION WITHIN 2 KM
// =====================================================

function isWithinTwoKm(
  userLocation,
  location
) {

  if (
    !userLocation ||
    !location
  ) {
    return false;
  }

  const userLatitude =
    Number(
      userLocation.latitude
    );

  const userLongitude =
    Number(
      userLocation.longitude
    );

  const locationLatitude =
    Number(
      location.latitude
    );

  const locationLongitude =
    Number(
      location.longitude
    );

  if (
    Number.isNaN(
      userLatitude
    ) ||
    Number.isNaN(
      userLongitude
    ) ||
    Number.isNaN(
      locationLatitude
    ) ||
    Number.isNaN(
      locationLongitude
    )
  ) {
    return false;
  }

  const distance =
    calculateDistanceKm(
      userLatitude,
      userLongitude,
      locationLatitude,
      locationLongitude
    );

  return (
    distance <=
    MAX_LOCATION_DISTANCE_KM
  );
}

// =====================================================
// GET DISTANCE FROM USER
// =====================================================

function getDistanceFromUser(
  userLocation,
  location
) {

  if (
    !userLocation ||
    !location
  ) {
    return null;
  }

  const userLatitude =
    Number(
      userLocation.latitude
    );

  const userLongitude =
    Number(
      userLocation.longitude
    );

  const locationLatitude =
    Number(
      location.latitude
    );

  const locationLongitude =
    Number(
      location.longitude
    );

  if (
    Number.isNaN(
      userLatitude
    ) ||
    Number.isNaN(
      userLongitude
    ) ||
    Number.isNaN(
      locationLatitude
    ) ||
    Number.isNaN(
      locationLongitude
    )
  ) {
    return null;
  }

  return calculateDistanceKm(
    userLatitude,
    userLongitude,
    locationLatitude,
    locationLongitude
  );
}

// =====================================================
// FORMAT DISTANCE
// =====================================================

function formatDistance(
  distanceKm
) {

  if (
    distanceKm == null
  ) {
    return "—";
  }

  if (
    distanceKm < 1
  ) {
    return `${Math.round(
      distanceKm * 1000
    )} m`;
  }

  return `${distanceKm.toFixed(
    2
  )} km`;
}

// =====================================================
// FORMAT ROAD DISTANCE
// =====================================================

function formatRouteDistance(
  distanceMeters
) {

  if (
    distanceMeters == null
  ) {
    return "—";
  }

  if (
    distanceMeters < 1000
  ) {
    return `${Math.round(
      distanceMeters
    )} m`;
  }

  return `${(
    distanceMeters / 1000
  ).toFixed(2)} km`;
}

// =====================================================
// FORMAT TRAVEL TIME
// =====================================================

function formatRouteDuration(
  durationSeconds
) {

  if (
    durationSeconds == null
  ) {
    return "—";
  }

  const totalMinutes =
    Math.round(
      durationSeconds / 60
    );

  if (
    totalMinutes < 60
  ) {
    return `${totalMinutes} min`;
  }

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (
    minutes === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

// =====================================================
// ROUTE CACHE KEY
// =====================================================

function createRouteCacheKey(
  start,
  end
) {

  const startLat =
    Number(
      start[0]
    ).toFixed(6);

  const startLon =
    Number(
      start[1]
    ).toFixed(6);

  const endLat =
    Number(
      end[0]
    ).toFixed(6);

  const endLon =
    Number(
      end[1]
    ).toFixed(6);

  return (
    `${ROUTE_CACHE_PREFIX}` +
    `${startLat}_${startLon}_` +
    `${endLat}_${endLon}`
  );
}

// =====================================================
// GET CACHED ROUTE
// =====================================================

function getCachedRoute(
  start,
  end
) {

  try {

    const key =
      createRouteCacheKey(
        start,
        end
      );

    const saved =
      localStorage.getItem(
        key
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    );

  } catch (error) {

    console.warn(
      "Unable to read cached route:",
      error
    );

    return null;
  }
}

// =====================================================
// SAVE ROUTE TO CACHE
// =====================================================

function saveCachedRoute(
  start,
  end,
  routeData
) {

  try {

    const key =
      createRouteCacheKey(
        start,
        end
      );

    localStorage.setItem(
      key,
      JSON.stringify(
        routeData
      )
    );

  } catch (error) {

    console.warn(
      "Unable to cache route:",
      error
    );

  }
}

// =====================================================
// FETCH ACTUAL ROAD ROUTE
// =====================================================

async function fetchRoadRoute(
  start,
  end
) {

  const startLatitude =
    Number(
      start[0]
    );

  const startLongitude =
    Number(
      start[1]
    );

  const endLatitude =
    Number(
      end[0]
    );

  const endLongitude =
    Number(
      end[1]
    );

  if (
    Number.isNaN(
      startLatitude
    ) ||
    Number.isNaN(
      startLongitude
    ) ||
    Number.isNaN(
      endLatitude
    ) ||
    Number.isNaN(
      endLongitude
    )
  ) {

    throw new Error(
      "Invalid route coordinates."
    );
  }

  const url =
    `${OSRM_URL}/` +
    `${startLongitude},${startLatitude};` +
    `${endLongitude},${endLatitude}` +
    `?overview=full` +
    `&geometries=geojson` +
    `&steps=true`;

  const response =
    await fetch(
      url,
      {
        method: "GET",
      }
    );

  if (
    !response.ok
  ) {

    throw new Error(
      `Routing server returned ${response.status}`
    );
  }

  const data =
    await response.json();

  if (
    data.code !==
    "Ok"
  ) {

    throw new Error(
      data.message ||
      "No road route found."
    );
  }

  if (
    !data.routes ||
    data.routes.length === 0
  ) {

    throw new Error(
      "No road route found."
    );
  }

  const selectedRoute =
    data.routes[0];

  const coordinates =
    selectedRoute
      ?.geometry
      ?.coordinates || [];

  const routeCoordinates =
    coordinates.map(
      (coordinate) => [
        Number(
          coordinate[1]
        ),
        Number(
          coordinate[0]
        ),
      ]
    );

  if (
    routeCoordinates.length <
    2
  ) {

    throw new Error(
      "Route geometry is unavailable."
    );
  }

  const routeData = {

    coordinates:
      routeCoordinates,

    distance:
      selectedRoute.distance,

    duration:
      selectedRoute.duration,

    steps:
      selectedRoute.legs
        ?.flatMap(
          (leg) =>
            leg.steps || []
        )
        .map(
          (step) => ({

            instruction:
              step.maneuver
                ?.instruction ||
              step.name ||
              "Continue",

            name:
              step.name ||
              "",

            distance:
              step.distance,

            duration:
              step.duration,

            type:
              step.maneuver
                ?.type ||
              "",

            modifier:
              step.maneuver
                ?.modifier ||
              "",

          })
        ) || [],

    createdAt:
      new Date().toISOString(),

  };

  return routeData;
}

// =====================================================
// LAT/LON -> TILE
// =====================================================

function latLonToTile(
  latitude,
  longitude,
  zoom
) {

  const latRad =
    (
      latitude *
      Math.PI
    ) / 180;

  const n =
    Math.pow(
      2,
      zoom
    );

  const x =
    Math.floor(
      (
        (longitude + 180) /
        360
      ) *
      n
    );

  const y =
    Math.floor(
      (
        1 -
        Math.asinh(
          Math.tan(
            latRad
          )
        ) /
          Math.PI
      ) /
        2 *
        n
    );

  return {
    x,
    y,
  };
}

// =====================================================
// CREATE TILE URL
// =====================================================

function createTileUrl(
  x,
  y,
  z
) {

  return (
    `https://tile.openstreetmap.org/` +
    `${z}/${x}/${y}.png`
  );
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
    OFFLINE_RADIUS_KM /
    111;

  const cosLatitude =
    Math.cos(
      (
        latitude *
        Math.PI
      ) /
        180
    );

  const lonDelta =
    OFFLINE_RADIUS_KM /
    (
      111 *
      Math.max(
        cosLatitude,
        0.1
      )
    );

  const minLat =
    latitude -
    latDelta;

  const maxLat =
    latitude +
    latDelta;

  const minLon =
    longitude -
    lonDelta;

  const maxLon =
    longitude +
    lonDelta;

  const topLeft =
    latLonToTile(
      maxLat,
      minLon,
      zoom
    );

  const bottomRight =
    latLonToTile(
      minLat,
      maxLon,
      zoom
    );

  const tiles = [];

  const maxTile =
    Math.pow(
      2,
      zoom
    ) - 1;

  const minX =
    Math.max(
      0,
      topLeft.x
    );

  const maxX =
    Math.min(
      maxTile,
      bottomRight.x
    );

  const minY =
    Math.max(
      0,
      topLeft.y
    );

  const maxY =
    Math.min(
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

        z:
          zoom,

        url:
          createTileUrl(
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
// OFFLINE TILE LAYER
// =====================================================

const CachedLeafletTileLayer = L.TileLayer.extend({

  createTile(coords, done) {

    const tile = document.createElement("img");

    tile.alt = "";
    tile.setAttribute("role", "presentation");
    tile.width = this.options.tileSize;
    tile.height = this.options.tileSize;

    if (this.options.crossOrigin) {
      tile.crossOrigin = "anonymous";
    }

    const tileUrl = L.Util.template(
      this._url,
      coords
    );

    const finishWithError = (error) => {
      console.warn(
        "Cached map tile could not be loaded:",
        tileUrl,
        error
      );
      done(error, tile);
    };

    if (!this.options.offlineMode) {
      tile.onload = () => done(null, tile);
      tile.onerror = (error) => finishWithError(error);
      tile.src = tileUrl;
      return tile;
    }

    if (!("caches" in window)) {
      finishWithError(
        new Error("Cache API is not supported.")
      );
      return tile;
    }

    caches
      .open(TILE_CACHE_NAME)
      .then((cache) => cache.match(tileUrl))
      .then(async (response) => {
        if (!response) {
          throw new Error("Tile is not available offline.");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        tile.onload = () => {
          URL.revokeObjectURL(objectUrl);
          done(null, tile);
        };

        tile.onerror = (error) => {
          URL.revokeObjectURL(objectUrl);
          finishWithError(error);
        };

        tile.src = objectUrl;
      })
      .catch(finishWithError);

    return tile;
  },
});

function CachedTileLayer({
  offlineMode,
  isOnline,
  mapMode,
}) {

  const map = useMap();

  const tileUrl =
    mapMode === "satellite"
      ? SATELLITE_TILE_URL
      : TILE_URL;

  useEffect(() => {

    const layer = new CachedLeafletTileLayer(
      tileUrl,
      {
      attribution:
        mapMode === "satellite"
          ? "Tiles &copy; Esri"
          : "&copy; OpenStreetMap contributors",
      maxZoom: 18,
      tileSize: 256,
      keepBuffer: 2,
      crossOrigin: true,
      offlineMode:
        mapMode === "map" &&
        (!isOnline || offlineMode),
      }
    );

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };

  }, [
    map,
    offlineMode,
    isOnline,
    tileUrl,
    mapMode,
  ]);

  return null;
}

// =====================================================
// REMOVE DUPLICATE LOCATIONS
// =====================================================

function removeDuplicateLocations(
  locations
) {

  const seen =
    new Set();

  return locations.filter(
    (
      location
    ) => {

      const latitude =
        Number(
          location.latitude
        ).toFixed(6);

      const longitude =
        Number(
          location.longitude
        ).toFixed(6);

      const key =
        `${latitude}_${longitude}`;

      if (
        seen.has(
          key
        )
      ) {

        return false;

      }

      seen.add(
        key
      );

      return true;

    }
  );
}

// =====================================================
// DISASTER MAP
// =====================================================

function DisasterMap({

  userLocation,

  shelters = [],

  safestLocations = [],

  foodServices = [],

  policeServices = [],

  weatherCondition = null,

  mapMode = "map",

  onMapModeChange,

  onOfflineModeChange,

  selectedShelter,

  onShelterClick,

  offlineMode = false,

}) {

  // ===================================================
  // ONLINE / OFFLINE
  // ===================================================

  const [
    isOnline,
    setIsOnline,
  ] = useState(

    typeof navigator !==
      "undefined"
      ? navigator.onLine
      : true

  );

  // ===================================================
  // DOWNLOAD STATE
  // ===================================================

  const [
    downloadState,
    setDownloadState,
  ] = useState(
    "idle"
  );

  const [
    downloadProgress,
    setDownloadProgress,
  ] = useState(
    0
  );

  const [
    downloadedTiles,
    setDownloadedTiles,
  ] = useState(
    0
  );

  const [
    totalTiles,
    setTotalTiles,
  ] = useState(
    0
  );

  // ===================================================
  // OFFLINE MAP INFO
  // ===================================================

  const [
    offlineMapInfo,
    setOfflineMapInfo,
  ] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          "offlineMapInfo"
        );

      return saved
        ? JSON.parse(
            saved
          )
        : null;

    } catch {

      return null;

    }

  });

  // ===================================================
  // ROUTE STATE
  // ===================================================

  const [
    route,
    setRoute,
  ] = useState([]);

  const [
    routeDistance,
    setRouteDistance,
  ] = useState(null);

  const [
    routeDuration,
    setRouteDuration,
  ] = useState(null);

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false);

  const [
    routeError,
    setRouteError,
  ] = useState(null);

  const [
    routeFromCache,
    setRouteFromCache,
  ] = useState(false);

  // ===================================================
  // ROUTE STEPS
  // ===================================================

  const [
    routeSteps,
    setRouteSteps,
  ] = useState([]);

  // ===================================================
  // AUTO DOWNLOAD REF
  // ===================================================

  const autoDownloadKeyRef =
    useRef("");

  // ===================================================
  // ONLINE/OFFLINE LISTENER
  // ===================================================

  useEffect(() => {

    const handleOnline =
      () => {
        setIsOnline(true);
      };

    const handleOffline =
      () => {
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
    useCallback(
      async () => {

        if (
          !userLocation
        ) {
          return;
        }

        if (
          !navigator.onLine
        ) {

          setDownloadState(
            "error"
          );

          return;

        }

        if (
          !(
            "caches" in
            window
          )
        ) {

          console.error(
            "Cache API is not supported."
          );

          setDownloadState(
            "error"
          );

          return;

        }

        try {

          setDownloadState(
            "downloading"
          );

          setDownloadProgress(
            0
          );

          setDownloadedTiles(
            0
          );

          const cache =
            await caches.open(
              TILE_CACHE_NAME
            );

          const latitude =
            Number(
              userLocation.latitude
            );

          const longitude =
            Number(
              userLocation.longitude
            );

          let allTiles =
            [];

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

          let completed =
            0;

          const concurrency =
            6;

          let currentIndex =
            0;

          const downloadTile =
            async () => {

              while (
                currentIndex <
                uniqueTiles.length
              ) {

                const index =
                  currentIndex++;

                const tile =
                  uniqueTiles[
                    index
                  ];

                try {

                  const existing =
                    await cache.match(
                      tile.url
                    );

                  if (
                    !existing
                  ) {

                    const response =
                      await fetch(
                        tile.url,
                        {
                          mode:
                            "cors",

                          cache:
                            "no-store",
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

                } catch (
                  error
                ) {

                  console.warn(
                    "Tile download failed:",
                    tile.url,
                    error
                  );

                }

                completed++;

                setDownloadedTiles(
                  completed
                );

                if (
                  uniqueTiles.length >
                  0
                ) {

                  setDownloadProgress(
                    Math.round(
                      (
                        completed /
                        uniqueTiles.length
                      ) *
                        100
                    )
                  );

                }

              }

            };

          const workers =
            [];

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
            JSON.stringify(
              mapInfo
            )
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

        } catch (
          error
        ) {

          console.error(
            "Offline map download failed:",
            error
          );

          setDownloadState(
            "error"
          );

        }

      },
      [
        userLocation,
      ]
    );

  // ===================================================
  // AUTOMATIC DOWNLOAD
  // ===================================================

  useEffect(() => {

    if (
      !isOnline ||
      !userLocation ||
      offlineMode
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

    const locationKey =
      `${latitude.toFixed(
        2
      )}_${longitude.toFixed(
        2
      )}`;

    if (
      autoDownloadKeyRef.current ===
      locationKey
    ) {
      return;
    }

    autoDownloadKeyRef.current =
      locationKey;

    downloadOfflineMap();

  }, [
    isOnline,
    userLocation,
    downloadOfflineMap,
    offlineMode,
  ]);

  // ===================================================
  // FILTER LOCATIONS TO 2 KM
  // ===================================================

  const nearbySafestLocations =
    removeDuplicateLocations(
      safestLocations.filter(
        (location) =>
          isWithinTwoKm(
            userLocation,
            location
          )
      )
    );

  const nearbyShelters =
    removeDuplicateLocations(
      shelters.filter(
        (shelter) =>
          isWithinTwoKm(
            userLocation,
            shelter
          )
      )
    );

  const validHospitalLocations =
    nearbyShelters.filter(
      (location) =>
        String(
          location?.type || ""
        )
          .trim()
          .toLowerCase() ===
        "hospital"
    );

  // ===================================================
  // FOOD SERVICES WITHIN 2 KM
  // ===================================================

  const nearbyFoodServices =
    removeDuplicateLocations(
      foodServices.filter(
        (service) =>
          isWithinTwoKm(
            userLocation,
            service
          )
      )
    );

  // ===================================================
  // POLICE SERVICES WITHIN 2 KM
  // ===================================================

  const nearbyPoliceServices =
    removeDuplicateLocations(
      policeServices.filter(
        (service) =>
          isWithinTwoKm(
            userLocation,
            service
          )
      )
    );

  // ===================================================
  // SERVICE VISIBILITY
  // ===================================================

  const hasWeatherCondition =
    typeof weatherCondition === "string" &&
    weatherCondition.trim().length > 0;

  const showFoodServices =
    !hasWeatherCondition ||
    weatherCondition === "Heavy Rain" ||
    weatherCondition === "Extreme Heat" ||
    weatherCondition === "Thunderstorm";

  const showPoliceServices =
    !hasWeatherCondition ||
    weatherCondition === "Heavy Rain" ||
    weatherCondition === "Extreme Heat" ||
    weatherCondition === "Thunderstorm";

  // ===================================================
  // CHECK SELECTED LOCATION
  // ===================================================

  const selectedLocationWithinRange =
    selectedShelter
      ? isWithinTwoKm(
          userLocation,
          selectedShelter
        )
      : false;

  // ===================================================
  // CALCULATE ACTUAL ROAD ROUTE
  // ===================================================

  useEffect(() => {

    if (
      !userLocation ||
      !selectedShelter ||
      selectedShelter.latitude ==
        null ||
      selectedShelter.longitude ==
        null
    ) {

      setRoute([]);

      setRouteDistance(
        null
      );

      setRouteDuration(
        null
      );

      setRouteSteps([]);

      setRouteError(
        null
      );

      setRouteFromCache(
        false
      );

      setRouteLoading(
        false
      );

      return;

    }

    if (
      !selectedLocationWithinRange
    ) {

      setRoute([]);

      setRouteDistance(
        null
      );

      setRouteDuration(
        null
      );

      setRouteSteps([]);

      setRouteFromCache(
        false
      );

      setRouteLoading(
        false
      );

      setRouteError(
        "This location is outside the 2 KM safety range."
      );

      return;

    }

    const start = [

      Number(
        userLocation.latitude
      ),

      Number(
        userLocation.longitude
      ),

    ];

    const end = [

      Number(
        selectedShelter.latitude
      ),

      Number(
        selectedShelter.longitude
      ),

    ];

    if (
      start.some(
        Number.isNaN
      ) ||
      end.some(
        Number.isNaN
      )
    ) {

      setRoute([]);

      setRouteError(
        "Invalid location coordinates."
      );

      return;

    }

    let cancelled =
      false;

    const loadRoute =
      async () => {

        setRouteLoading(
          true
        );

        setRouteError(
          null
        );

        setRouteFromCache(
          false
        );

        const cachedRoute =
          getCachedRoute(
            start,
            end
          );

        if (
          !navigator.onLine
        ) {

          if (
            cachedRoute &&
            cachedRoute.coordinates
          ) {

            if (
              cancelled
            ) {
              return;
            }

            setRoute(
              cachedRoute.coordinates
            );

            setRouteDistance(
              cachedRoute.distance
            );

            setRouteDuration(
              cachedRoute.duration
            );

            setRouteSteps(
              cachedRoute.steps ||
              []
            );

            setRouteFromCache(
              true
            );

            setRouteLoading(
              false
            );

            return;

          }

          if (
            !cancelled
          ) {

            setRoute([]);

            setRouteError(
              "No cached road route is available for this destination."
            );

            setRouteLoading(
              false
            );

          }

          return;

        }

        try {

          const routeData =
            await fetchRoadRoute(
              start,
              end
            );

          if (
            cancelled
          ) {
            return;
          }

          setRoute(
            routeData.coordinates
          );

          setRouteDistance(
            routeData.distance
          );

          setRouteDuration(
            routeData.duration
          );

          setRouteSteps(
            routeData.steps ||
            []
          );

          setRouteFromCache(
            false
          );

          saveCachedRoute(
            start,
            end,
            routeData
          );

        } catch (
          error
        ) {

          console.error(
            "Road route error:",
            error
          );

          const fallbackRoute =
            getCachedRoute(
              start,
              end
            );

          if (
            fallbackRoute &&
            fallbackRoute.coordinates
          ) {

            if (
              !cancelled
            ) {

              setRoute(
                fallbackRoute.coordinates
              );

              setRouteDistance(
                fallbackRoute.distance
              );

              setRouteDuration(
                fallbackRoute.duration
              );

              setRouteSteps(
                fallbackRoute.steps ||
                []
              );

              setRouteFromCache(
                true
              );

              setRouteError(
                null
              );

            }

          } else {

            if (
              !cancelled
            ) {

              setRoute([]);

              setRouteDistance(
                null
              );

              setRouteDuration(
                null
              );

              setRouteSteps([]);

              setRouteError(
                "Unable to find a road route. Please try again."
              );

            }

          }

        } finally {

          if (
            !cancelled
          ) {

            setRouteLoading(
              false
            );

          }

        }

      };

    loadRoute();

    return () => {
      cancelled = true;
    };

  }, [
    userLocation,
    selectedShelter,
    offlineMode,
    selectedLocationWithinRange,
  ]);

  // ===================================================
  // NO LOCATION
  // ===================================================

  if (
    !userLocation
  ) {

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
  // SELECTED LOCATION POSITION
  // ===================================================

  const selectedPosition =

    selectedShelter &&
    selectedShelter.latitude !=
      null &&
    selectedShelter.longitude !=
      null &&
    selectedLocationWithinRange

      ? [

          Number(
            selectedShelter.latitude
          ),

          Number(
            selectedShelter.longitude
          ),

          ]

      : null;

  // ===================================================
  // VALID SHELTERS
  // ===================================================

  const validShelters =
    nearbyShelters.filter(
      (shelter) =>
        shelter.latitude !=
          null &&
        shelter.longitude !=
          null &&
        String(
          shelter?.type || ""
        )
          .trim()
          .toLowerCase() !==
        "hospital"
    );

  // ===================================================
  // VALID SAFEST LOCATIONS
  // ===================================================

  const validSafestLocations =
    nearbySafestLocations.filter(
      (location) =>
        location.latitude !=
          null &&
        location.longitude !=
          null
    );

  // ===================================================
  // VALID FOOD SERVICES
  // ===================================================

  const validFoodServices =
    nearbyFoodServices.filter(
      (service) =>
        service.latitude !=
          null &&
        service.longitude !=
          null
    );

  // ===================================================
  // VALID POLICE SERVICES
  // ===================================================

  const validPoliceServices =
    nearbyPoliceServices.filter(
      (service) =>
        service.latitude !=
          null &&
        service.longitude !=
          null
    );

  // ===================================================
  // OFFLINE MAP EXISTS
  // ===================================================

  const hasOfflineMap =
    Boolean(
      offlineMapInfo
    );

  // ===================================================
  // STATUS
  // ===================================================

  let mapStatusText;

  if (
    offlineMode
  ) {

    if (
      isOnline
    ) {

      mapStatusText =
        hasOfflineMap
          ? "Online • Offline map available"
          : "Online • Map connected";

    } else {

      mapStatusText =
        hasOfflineMap
          ? "Offline • Cached map"
          : "Offline • Cached tiles unavailable";

    }

  } else {

    if (
      isOnline
    ) {

      if (
        downloadState ===
        "downloading"
      ) {

        mapStatusText =
          "Online • Downloading map...";

      } else if (

        downloadState ===
          "downloaded" ||

        hasOfflineMap

      ) {

        mapStatusText =
          "Online • Offline map ready";

      } else {

        mapStatusText =
          "Online • Map connected";

      }

    } else {

      mapStatusText =
        hasOfflineMap
          ? "Offline • Cached map"
          : "Offline • Map not downloaded";

    }

  }

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className={`disaster-map-wrapper ${
        offlineMode
          ? "offline-map-instance"
          : "main-map-instance"
      }`}
    >

      {/* =============================================
          COMPACT MAP TOOLBAR
      ============================================== */}

      <div className="map-compact-toolbar">

        <div className="map-switcher map-compact-switcher">

          <button
            type="button"
            className={
              mapMode === "map" && !offlineMode
                ? "active"
                : ""
            }
            onClick={() => {
              if (onMapModeChange) {
                onMapModeChange("map");
              }

              if (onOfflineModeChange) {
                onOfflineModeChange(false);
              }
            }}
          >
            Map
          </button>

          <button
            type="button"
            className={
              mapMode === "satellite" && !offlineMode
                ? "active"
                : ""
            }
            onClick={() => {
              if (onMapModeChange) {
                onMapModeChange("satellite");
              }

              if (onOfflineModeChange) {
                onOfflineModeChange(false);
              }
            }}
          >
            Satellite
          </button>

          <button
            type="button"
            className={
              offlineMode
                ? "active"
                : ""
            }
            onClick={() => {
              if (onMapModeChange) {
                onMapModeChange("map");
              }

              if (onOfflineModeChange) {
                onOfflineModeChange(true);
              }
            }}
          >
            Offline Map
          </button>

        </div>

        <div className="map-toolbar-divider"></div>

        <div
          className={`map-status ${
            isOnline
              ? "map-status-online"
              : "map-status-offline"
          }`}
        >

          <span className="status-dot"></span>

          <span>
            {mapStatusText}
          </span>

        </div>

        <div className="map-toolbar-divider"></div>

        <div className="map-toolbar-range">

          <span className="map-toolbar-range-icon">
            📏
          </span>

          <span>
            <strong>2 KM</strong>
            {" "}
            safety range
          </span>

        </div>

        <div className="map-toolbar-divider"></div>

        <div className="map-toolbar-weather">

          <span className="map-toolbar-weather-icon">
            {weatherCondition ===
            "Heavy Rain"
              ? "🌧️"
              : weatherCondition ===
                "Extreme Heat"
              ? "☀️"
              : weatherCondition ===
                "Thunderstorm"
              ? "⛈️"
              : "🌤️"}
          </span>

          <span>
            {weatherCondition ||
              "Weather unavailable"}
          </span>

        </div>

        {!offlineMode && (

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

            <span className="map-download-icon">
              <Download size={14} strokeWidth={2.4} />
            </span>

            {downloadState ===
            "downloading"
              ? `Downloading ${downloadProgress}%`
              : "Download 2 KM"}

          </button>

        )}

      </div>

      {/* =============================================
          DOWNLOAD PROGRESS
      ============================================== */}

      {!offlineMode &&
        downloadState ===
          "downloading" && (

        <div className="map-download-progress">

          <div className="progress-bar-background">

            <div
              className="progress-bar-fill"
              style={{
                width:
                  `${downloadProgress}%`,
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
          SUCCESS
      ============================================== */}

      {false &&
        !offlineMode &&
        downloadState ===
          "downloaded" && (

        <div className="map-download-success">

          ✅ 2 KM offline map saved
          on this device.

        </div>

      )}

      {/* =============================================
          ERROR
      ============================================== */}

      {!offlineMode &&
        downloadState ===
          "error" && (

        <div className="map-download-error">

          ⚠️ Unable to download all
          map tiles. Please try again
          while connected to the internet.

        </div>

      )}

      {/* =============================================
          OFFLINE LOCATION
      ============================================== */}

      {!isOnline && (

        <div className="offline-location-info">

          <div>

            📍{" "}
            <strong>
              Last known location
            </strong>

          </div>

          <span>
            GPS location saved on this device
          </span>

        </div>

      )}

      {/* =============================================
          ROUTE LOADING
      ============================================== */}

      {selectedPosition &&
        routeLoading && (

        <div className="route-loading">

          <span>
            🛣️
          </span>

          <div>

            <strong>
              Finding road route...
            </strong>

            <p>
              Calculating the actual road
              distance between your location
              and the safest location.
            </p>

          </div>

        </div>

      )}

      {/* =============================================
          ROUTE ERROR
      ============================================== */}

      {selectedPosition &&
        !routeLoading &&
        routeError && (

        <div className="route-error">

          <span>
            ⚠️
          </span>

          <div>

            <strong>
              Road route unavailable
            </strong>

            <p>
              {routeError}
            </p>

          </div>

        </div>

      )}

      {/* =============================================
          ROAD ROUTE INFORMATION
      ============================================== */}

      {selectedPosition &&
        !routeLoading &&
        route.length >= 2 && (

        <div className="route-information">

          <div className="route-information-header">

            <div className="route-title-icon">
              🛣️
            </div>

            <div className="route-title-content">

              <h4>
                Route to Safest Location
              </h4>

              {routeFromCache && (

                <span className="route-cache-badge">
                  Offline route
                </span>

              )}

            </div>

          </div>

          <div className="route-path">

            <div className="route-location">

              <div className="route-marker from-marker">

                <span></span>

              </div>

              <div className="route-location-text">

                <span className="route-label">
                  From
                </span>

                <strong>
                  Your Location
                </strong>

              </div>

            </div>

            <div className="route-connector">

              <div></div>

            </div>

            <div className="route-location">

              <div className="route-marker to-marker">
                🛡️
              </div>

              <div className="route-location-text">

                <span className="route-label">
                  Safest Location
                </span>

                <strong>
                  {selectedShelter?.name ||
                    "Safest Location"}
                </strong>

              </div>

            </div>

          </div>

          <div className="route-details">

            <div className="route-detail">

              <div className="route-detail-icon">
                📏
              </div>

              <div>

                <span>
                  Road distance
                </span>

                <strong>
                  {formatRouteDistance(
                    routeDistance
                  )}
                </strong>

              </div>

            </div>

            <div className="route-detail-divider"></div>

            <div className="route-detail">

              <div className="route-detail-icon">
                ⏱️
              </div>

              <div>

                <span>
                  Estimated time
                </span>

                <strong>
                  {formatRouteDuration(
                    routeDuration
                  )}
                </strong>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =============================================
          MAP
      ============================================== */}

      <div className="disaster-map-container clean-map-view">

        <MapContainer

          zoomControl={false}

          center={

            offlineMode &&
            selectedPosition

              ? selectedPosition

              : userPosition

          }

          zoom={
            offlineMode
              ? 16
              : 15
          }

          minZoom={
            10
          }

          maxZoom={
            isOnline
              ? 18
              : 16
          }

          scrollWheelZoom={
            true
          }

          className="disaster-map"

        >

          <CachedTileLayer

            offlineMode={
              offlineMode
            }

            isOnline={
              isOnline
            }

            mapMode={
              mapMode
            }

          />

          {/* =========================================
              MAIN MAP CONTROLLER
              IMPORTANT:
              MAIN MAP DOES NOT MOVE WHEN SAFEST
              CARD IS SELECTED.
          ========================================== */}

          <MapController

            location={
              userLocation
            }

            offlineMode={
              offlineMode
            }

            shelters={
              validShelters
            }

            selectedShelter={
              selectedShelter
            }

          />

          <RouteMapController
            route={
              route
            }
          />

          {/* =========================================
              USER
          ========================================== */}

          <Marker

            position={
              userPosition
            }

            icon={
              userIcon
            }

          >

            <Popup>

              <div className="map-popup">

                <strong>
                  📍 Your Location
                </strong>

                <p style={{ margin: "6px 0 0" }}>
                  GPS location is available for safety services.
                </p>

                {!isOnline && (

                  <p className="popup-offline">
                    🔴 Last saved location
                  </p>

                )}

              </div>

            </Popup>

          </Marker>

          {/* =========================================
              2 KM CIRCLE
          ========================================== */}

          <Circle

            center={
              userPosition
            }

            radius={
              MAX_LOCATION_DISTANCE_KM *
              1000
            }

            pathOptions={{
              fillOpacity:
                0.08,

              weight:
                2,
            }}

          />

          {/* =========================================
              SAFEST LOCATIONS
          ========================================== */}

          <MarkerClusterGroup>
            {validSafestLocations.map(
              (
                location,
                index
              ) => {

              const locationId =
                location.id ??
                `safest-${index}`;

              const distanceKm =
                getDistanceFromUser(
                  userLocation,
                  location
                );

              return (

                <Marker

                  key={
                    `safest-${locationId}`
                  }

                  position={[

                    Number(
                      location.latitude
                    ),

                    Number(
                      location.longitude
                    ),

                  ]}

                  icon={
                    safestIcon
                  }

                  eventHandlers={{

                    click:
                      () => {

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

                        🛡️{" "}

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

                      {location.capacity !=
                        null && (

                        <>
                          <br />
                          👥 Capacity:
                          {" "}
                          {location.capacity}
                        </>

                      )}

                      {location.elevation !=
                        null && (

                        <>
                          <br />
                          ⛰️ Elevation:
                          {" "}
                          {location.elevation}
                          {" m"}
                        </>

                      )}

                      <br />

                      📏 Distance from you:
                      {" "}

                      <strong>
                        {formatDistance(
                          distanceKm
                        )}
                      </strong>

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
          </MarkerClusterGroup>

          {/* =========================================
              HOSPITAL LOCATIONS
          ========================================== */}

          <MarkerClusterGroup>
            {validHospitalLocations.map(
              (
                hospital,
                index
              ) => {

              const hospitalId =
                hospital.id ??
                `hospital-${index}`;

              const distanceKm =
                getDistanceFromUser(
                  userLocation,
                  hospital
                );

              return (

                <Marker

                  key={
                    `hospital-${hospitalId}`
                  }

                  position={[

                    Number(
                      hospital.latitude
                    ),

                    Number(
                      hospital.longitude
                    ),

                  ]}

                  icon={
                    hospitalIcon
                  }

                  eventHandlers={{

                    click:
                      () => {

                        if (
                          onShelterClick
                        ) {

                          onShelterClick(
                            hospital
                          );

                        }

                      },

                  }}

                >

                  <Popup>

                    <div className="map-popup">

                      <strong>

                        ✚{" "}

                        {hospital.name ||
                          hospital.locationName ||
                          "Hospital"}

                      </strong>

                      {hospital.address && (

                        <>
                          <br />
                          {hospital.address}
                        </>

                      )}

                      <br />

                      📏 Distance from you:
                      {" "}

                      <strong>
                        {formatDistance(
                          distanceKm
                        )}
                      </strong>

                    </div>

                  </Popup>

                </Marker>

              );

            }

            )}
          </MarkerClusterGroup>

          {/* =========================================
              NORMAL SAFE LOCATIONS
          ========================================== */}

          <MarkerClusterGroup>
            {validShelters.map(
              (
                shelter,
                index
              ) => {

              const shelterId =
                shelter.id ??
                `shelter-${index}`;

              const distanceKm =
                getDistanceFromUser(
                  userLocation,
                  shelter
                );

              return (

                <Marker

                  key={
                    `shelter-${shelterId}`
                  }

                  position={[

                    Number(
                      shelter.latitude
                    ),

                    Number(
                      shelter.longitude
                    ),

                  ]}

                  icon={
                    shelterIcon
                  }

                  eventHandlers={{

                    click:
                      () => {

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

                        🏠{" "}

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

                      {shelter.capacity !=
                        null && (

                        <>
                          <br />
                          👥 Capacity:
                          {" "}
                          {shelter.capacity}
                        </>

                      )}

                      <br />

                      📏 Distance from you:
                      {" "}

                      <strong>
                        {formatDistance(
                          distanceKm
                        )}
                      </strong>

                    </div>

                  </Popup>

                </Marker>

              );

            }

            )}
          </MarkerClusterGroup>

          {/* =========================================
              FOOD SERVICES
          ========================================== */}

          {showFoodServices && (
            <MarkerClusterGroup>
              {validFoodServices.map(
                (
                  service,
                  index
                ) => {

                const serviceId =
                  service.id ??
                  `food-${index}`;

                const distanceKm =
                  getDistanceFromUser(
                    userLocation,
                    service
                  );

                return (

                  <Marker

                    key={
                      `food-service-${serviceId}`
                    }

                    position={[

                      Number(
                        service.latitude
                      ),

                      Number(
                        service.longitude
                      ),

                    ]}

                    icon={
                      foodServiceIcon
                    }

                  >

                    <Popup>

                      <div className="map-popup service-popup">

                        <div className="service-popup-title food-title">

                          🍱

                          <strong>
                            Food Service
                          </strong>

                        </div>

                        <hr />

                        <strong>

                          {service.name ||
                            "Food Service Center"}

                        </strong>

                        {service.address && (

                          <>
                            <br />
                            📍{" "}
                            {service.address}
                          </>

                        )}

                        {service.phone && (

                          <>
                            <br />
                            📞{" "}
                            {service.phone}
                          </>

                        )}

                        <br />

                        📏 Distance from you:
                        {" "}

                        <strong>
                          {formatDistance(
                            distanceKm
                          )}
                        </strong>

                        <div className="service-weather-note">

                          {weatherCondition ===
                          "Extreme Heat"

                            ? "💧 Food and relief services are shown for heat-support needs."

                            : weatherCondition ===
                              "Heavy Rain"

                            ? "🌧️ Food relief services are highlighted because of the rain emergency."

                            : weatherCondition ===
                              "Thunderstorm"

                            ? "⛈️ Food support services are available within the safety range."

                            : "🍱 Food support service available nearby."}

                        </div>

                      </div>

                    </Popup>

                  </Marker>

                );

                }
              )}
            </MarkerClusterGroup>
          )}

          {/* =========================================
              POLICE SERVICES
          ========================================== */}

          {showPoliceServices && (
            <MarkerClusterGroup>
              {validPoliceServices.map(
                (
                  service,
                  index
                ) => {

                const serviceId =
                  service.id ??
                  `police-${index}`;

                const distanceKm =
                  getDistanceFromUser(
                    userLocation,
                    service
                  );

                return (

                  <Marker

                    key={
                      `police-service-${serviceId}`
                    }

                    position={[

                      Number(
                        service.latitude
                      ),

                      Number(
                        service.longitude
                      ),

                    ]}

                    icon={
                      policeServiceIcon
                    }

                  >

                    <Popup>

                      <div className="map-popup service-popup">

                        <div className="service-popup-title police-title">

                          👮

                          <strong>
                            Police Service
                          </strong>

                        </div>

                        <hr />

                        <strong>

                          {service.name ||
                            "Police Station"}

                        </strong>

                        {service.address && (

                          <>
                            <br />
                            📍{" "}
                            {service.address}
                          </>

                        )}

                        {service.phone && (

                          <>
                            <br />
                            📞{" "}
                            {service.phone}
                          </>

                        )}

                        <br />

                        📏 Distance from you:
                        {" "}

                        <strong>
                          {formatDistance(
                            distanceKm
                          )}
                        </strong>

                        <div className="service-weather-note">

                          {weatherCondition ===
                          "Heavy Rain"

                            ? "🚔 Police support is highlighted during heavy rain emergencies."

                            : weatherCondition ===
                              "Extreme Heat"

                            ? "🚔 Police assistance remains available during heat emergencies."

                            : weatherCondition ===
                              "Thunderstorm"

                            ? "⛈️ Police support is highlighted during storm conditions."

                            : "🚔 Police emergency service available nearby."}

                        </div>

                      </div>

                    </Popup>

                  </Marker>

                );

                }
              )}
            </MarkerClusterGroup>
          )}

          {/* =========================================
              ACTUAL ROAD ROUTE
          ========================================== */}

          {route.length >= 2 &&
            selectedLocationWithinRange && (

            <Polyline

              positions={
                route
              }

              pathOptions={{

                weight:
                  6,

                opacity:
                  0.9,

                lineCap:
                  "round",

                lineJoin:
                  "round",

              }}

            />

          )}

        </MapContainer>

      </div>

      {/* =============================================
          LEGEND
      ============================================== */}

      {/* =============================================
          SERVICE INFORMATION
      ============================================== */}

      {(validFoodServices.length > 0 ||
        validPoliceServices.length > 0) && (

        <div className="service-summary">

          <div className="service-summary-title">
            🚨 Nearby Emergency Services
          </div>

          <div className="service-summary-items">

            {showFoodServices &&
              validFoodServices.length >
                0 && (

              <span className="service-summary-food">

                🍱{" "}
                {validFoodServices.length} Food{" "}
                {validFoodServices.length ===
                1
                  ? "service"
                  : "services"}

              </span>

            )}

            {showPoliceServices &&
              validPoliceServices.length >
                0 && (

              <span className="service-summary-police">

                👮{" "}
                {validPoliceServices.length} Police{" "}
                {validPoliceServices.length ===
                1
                  ? "service"
                  : "services"}

              </span>

            )}

          </div>

        </div>

      )}

      {/* =============================================
          OFFLINE MESSAGE
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
              The app is using saved
              location information and
              cached map tiles.

            </p>

            {!hasOfflineMap && (

              <p className="offline-warning">

                ⚠️ No cached map tiles
                are available yet.

              </p>

            )}

          </div>

        </div>

      )}

      {/* =============================================
          OFFLINE MAP INFORMATION
      ============================================== */}

      {false && hasOfflineMap && (

        <div className="offline-map-info">

          <span>
            💾
          </span>

          <div>

            <strong>
              Offline map available
            </strong>

            <small>

              {
                offlineMapInfo.downloadedTiles
              }{" "}

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
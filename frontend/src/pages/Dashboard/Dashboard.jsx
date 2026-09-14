import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import "./Dashboard.css";

import DisasterMap from "../../components/DisasterMap/DisasterMap";
import SOSButton from "../../components/SOS/SOSButton";
import {
  requestNotificationPermission,
  listenForMessages,
} from "../../firebaseMessaging";

const API_BASE_URL =
  "http://localhost:8080/api";

const MAX_DISTANCE_KM = 2;

// =====================================================
// WEATHER CACHE
// =====================================================

const WEATHER_CACHE_KEY =
  "latestWeather";

const WEATHER_CACHE_TIME_KEY =
  "latestWeatherUpdatedAt";

// =====================================================
// SAFE LOCATION CACHE
// =====================================================

const SAFE_LOCATIONS_CACHE_KEY =
  "safeLocations";

const ROAD_DISTANCE_CACHE_KEY =
  "safeLocationRoadDistances";

// =====================================================
// ROAD ROUTING
// =====================================================

const OSRM_URL =
  "https://router.project-osrm.org/route/v1/driving";

// =====================================================
// DISTANCE CALCULATION
// =====================================================

function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

// =====================================================
// NORMALIZE DISASTER TYPE
// =====================================================

function normalizeDisasterType(type) {
  if (!type) {
    return null;
  }

  const value =
    String(type)
      .trim()
      .toLowerCase();

  if (
    value === "heavy sun" ||
    value === "extreme heat" ||
    value === "heat wave" ||
    value === "heatwave"
  ) {
    return "Extreme Heat";
  }

  if (
    value === "heavy rain" ||
    value === "heavy rainfall" ||
    value === "rainfall"
  ) {
    return "Heavy Rain";
  }

  return type;
}

// =====================================================
// SERVICE TYPE
// =====================================================

function normalizeServiceType(type) {
  const value =
    String(type || "")
      .trim()
      .toLowerCase();

  if (
    value.includes("food") ||
    value.includes("meal") ||
    value.includes("relief")
  ) {
    return "FOOD";
  }

  if (
    value.includes("police")
  ) {
    return "POLICE";
  }

  return "";
}

// =====================================================
// CHECK SERVICE LOCATION
// =====================================================

function isServiceLocation(location) {
  const serviceType =
    normalizeServiceType(
      location?.type
    );

  return (
    serviceType === "FOOD" ||
    serviceType === "POLICE"
  );
}

// =====================================================
// WEATHER CONDITION
// =====================================================

function getWeatherCondition(
  weather,
  disasterType
) {
  const description =
    String(
      weather?.description ??
        weather?.weather?.[0]
          ?.description ??
        ""
    ).toLowerCase();

  const temperature =
    Number(
      weather?.temperature ??
        weather?.main?.temp
    );

  if (
    description.includes(
      "thunderstorm"
    ) ||
    description.includes(
      "storm"
    )
  ) {
    return "Thunderstorm";
  }

  if (
    disasterType ===
      "Extreme Heat" ||
    description.includes("heat") ||
    description.includes("hot") ||
    description.includes(
      "scorching"
    ) ||
    (
      Number.isFinite(
        temperature
      ) &&
      temperature >= 40
    )
  ) {
    return "Extreme Heat";
  }

  if (
    disasterType ===
      "Heavy Rain" ||
    description.includes(
      "very heavy rain"
    ) ||
    description.includes(
      "heavy rain"
    ) ||
    description.includes(
      "rain"
    ) ||
    description.includes(
      "drizzle"
    ) ||
    description.includes(
      "shower"
    )
  ) {
    return "Heavy Rain";
  }

  return "Normal";
}

// =====================================================
// HEAT SAFETY SCORE
// =====================================================

function getHeatSafetyScore(location) {
  const type =
    String(location?.type || "")
      .toLowerCase();

  if (type.includes("hospital")) {
    return 100;
  }

  if (type.includes("shelter")) {
    return 90;
  }

  if (type.includes("school")) {
    return 80;
  }

  if (type.includes("community")) {
    return 80;
  }

  if (type.includes("building")) {
    return 70;
  }

  return 50;
}

// =====================================================
// FORMAT DISTANCE
// =====================================================

function formatDistance(distance) {
  if (distance == null) {
    return "—";
  }

  if (distance < 1) {
    return `${Math.round(
      distance * 1000
    )} m`;
  }

  return `${distance.toFixed(2)} km`;
}

// =====================================================
// FORMAT WEATHER LAST UPDATED
// =====================================================

function formatWeatherTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  try {
    const date =
      dateValue instanceof Date
        ? dateValue
        : new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "";
  }
}

// =====================================================
// UNIQUE LOCATIONS
// =====================================================

function removeDuplicateLocations(
  locations
) {
  return locations.filter(
    (location, index, array) =>
      index ===
      array.findIndex(
        (item) => {
          if (
            item.id != null &&
            location.id != null
          ) {
            return (
              item.id ===
              location.id
            );
          }

          return (
            item.name ===
              location.name &&
            Number(
              item.latitude
            ) ===
              Number(
                location.latitude
              ) &&
            Number(
              item.longitude
            ) ===
              Number(
                location.longitude
              )
          );
        }
      )
  );
}

// =====================================================
// ROAD DISTANCE CACHE HELPERS
// =====================================================

function getRoadDistanceCache() {
  try {
    const saved =
      localStorage.getItem(
        ROAD_DISTANCE_CACHE_KEY
      );

    if (!saved) {
      return {};
    }

    const parsed =
      JSON.parse(saved);

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}

// =====================================================
// ROAD DISTANCE CACHE KEY
// =====================================================

function createRoadDistanceKey(
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude
) {
  return [
    Number(startLatitude).toFixed(5),
    Number(startLongitude).toFixed(5),
    Number(endLatitude).toFixed(5),
    Number(endLongitude).toFixed(5),
  ].join("_");
}

// =====================================================
// GET ROAD DISTANCE USING OSRM
// =====================================================

async function getRoadDistance(
  userLocation,
  destination
) {
  if (
    !userLocation ||
    !destination
  ) {
    return null;
  }

  const startLatitude =
    Number(
      userLocation.latitude
    );

  const startLongitude =
    Number(
      userLocation.longitude
    );

  const endLatitude =
    Number(
      destination.latitude
    );

  const endLongitude =
    Number(
      destination.longitude
    );

  if (
    !Number.isFinite(
      startLatitude
    ) ||
    !Number.isFinite(
      startLongitude
    ) ||
    !Number.isFinite(
      endLatitude
    ) ||
    !Number.isFinite(
      endLongitude
    )
  ) {
    return null;
  }

  const cacheKey =
    createRoadDistanceKey(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude
    );

  const cache =
    getRoadDistanceCache();

  if (
    cache[cacheKey] &&
    Number.isFinite(
      Number(
        cache[cacheKey].distance
      )
    )
  ) {
    return {
      distance:
        Number(
          cache[cacheKey].distance
        ),

      duration:
        Number(
          cache[cacheKey].duration ||
            0
        ),

      fromCache: true,
    };
  }

  try {
    const url =
      `${OSRM_URL}/` +
      `${startLongitude},${startLatitude};` +
      `${endLongitude},${endLatitude}` +
      `?overview=false`;

    const response =
      await axios.get(
        url,
        {
          timeout: 8000,
        }
      );

    const route =
      response.data?.routes?.[0];

    if (!route) {
      return null;
    }

    const roadDistance =
      Number(route.distance) /
      1000;

    const duration =
      Number(route.duration);

    if (
      !Number.isFinite(
        roadDistance
      )
    ) {
      return null;
    }

    const updatedCache =
      getRoadDistanceCache();

    updatedCache[cacheKey] = {
      distance:
        roadDistance,

      duration,

      savedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      ROAD_DISTANCE_CACHE_KEY,
      JSON.stringify(
        updatedCache
      )
    );

    return {
      distance:
        roadDistance,

      duration,

      fromCache: false,
    };
  } catch (error) {

    console.error(
      "Road distance error:",
      error
    );

    return null;
  }
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {

  // ===================================================
  // LOCATION
  // ===================================================

  const [
    userLocation,
    setUserLocation,
  ] = useState(null);

  // ===================================================
  // INTERNET
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
  // ALERT
  // ===================================================

  const [
    alert,
    setAlert,
  ] = useState(null);

  const [
    loadingAlert,
    setLoadingAlert,
  ] = useState(true);

  // ===================================================
  // WEATHER
  // ===================================================

  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    loadingWeather,
    setLoadingWeather,
  ] = useState(false);

  const [
    weatherLastUpdated,
    setWeatherLastUpdated,
  ] = useState(null);

  // ===================================================
  // SAFE LOCATIONS
  // ===================================================

  const [
    safestLocations,
    setSafestLocations,
  ] = useState([]);

  const [
    allSafeLocations,
    setAllSafeLocations,
  ] = useState([]);

  const [
    loadingLocations,
    setLoadingLocations,
  ] = useState(false);

  // ===================================================
  // MAIN MAP SELECTED LOCATION
  // ===================================================

  const [
    selectedShelter,
    setSelectedShelter,
  ] = useState(null);

  // ===================================================
  // SECOND MAP SELECTED LOCATION
  // ===================================================

  const [
    selectedOfflineLocation,
    setSelectedOfflineLocation,
  ] = useState(null);

  // ===================================================
  // ONLINE / OFFLINE LISTENER
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
  // FIREBASE PUSH NOTIFICATIONS
  // ===================================================

  const enableFirebaseNotifications = async () => {

    try {

      const token =
        await requestNotificationPermission();

      if (token) {

        console.log("=================================");
        console.log("FCM TOKEN RECEIVED:");
        console.log(token);
        console.log("=================================");

        // The FCM token will be sent to Spring Boot
        // and stored in MySQL in the next backend step.
      }

    } catch (error) {

      console.error(
        "Firebase notification setup error:",
        error
      );

    }

  };

  useEffect(() => {

    const unsubscribe = listenForMessages((payload) => {

      console.log("=================================");
      console.log("FOREGROUND FIREBASE NOTIFICATION:");
      console.log(payload);
      console.log("=================================");

      const title =
        payload?.notification?.title ||
        payload?.data?.title ||
        "Disaster Alert";

      const body =
        payload?.notification?.body ||
        payload?.data?.body ||
        "A new emergency alert has been received.";

      if (Notification.permission === "granted") {

        new Notification(title, {
          body,
          icon: "/firebase-logo.png",
          data: payload?.data || {},
        });

      }

    });

    return () => {

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }

    };

  }, []);

  // ===================================================
  // GET USER LOCATION
  // ===================================================

  const getLocation =
    useCallback(() => {

      if (
        !navigator.geolocation
      ) {

        window.alert(
          "Geolocation is not supported by this browser."
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        (position) => {

          const location = {

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

          };

          setUserLocation(
            location
          );

          localStorage.setItem(
            "lastKnownLocation",
            JSON.stringify(
              location
            )
          );

        },

        (error) => {

          console.error(
            "Location error:",
            error
          );

          const savedLocation =
            localStorage.getItem(
              "lastKnownLocation"
            );

          if (savedLocation) {

            try {

              setUserLocation(
                JSON.parse(
                  savedLocation
                )
              );

            } catch {

              setUserLocation(
                null
              );

            }

          } else {

            window.alert(
              "Unable to get your location. Please allow location access."
            );

          }

        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }

      );

    }, []);

  // ===================================================
  // INITIAL LOCATION
  // ===================================================

  useEffect(() => {

    const savedLocation =
      localStorage.getItem(
        "lastKnownLocation"
      );

    if (savedLocation) {

      try {

        setUserLocation(
          JSON.parse(
            savedLocation
          )
        );

      } catch {

        getLocation();

      }

    } else {

      getLocation();

    }

  }, [getLocation]);

  // ===================================================
  // GET LATEST ALERT
  // ===================================================

  const getLatestAlert =
    useCallback(async () => {

      try {

        setLoadingAlert(true);

        if (!navigator.onLine) {

          throw new Error(
            "Offline"
          );

        }

        const response =
          await axios.get(
            `${API_BASE_URL}/disaster-alert/latest`,
            {
              timeout: 5000,
            }
          );

        const data =
          response.data || null;

        setAlert(data);

        if (data) {

          localStorage.setItem(
            "latestDisasterAlert",
            JSON.stringify(
              data
            )
          );

        }

      } catch (error) {

        console.error(
          "Alert loading error:",
          error
        );

        const savedAlert =
          localStorage.getItem(
            "latestDisasterAlert"
          );

        if (savedAlert) {

          try {

            setAlert(
              JSON.parse(
                savedAlert
              )
            );

          } catch {

            setAlert(null);

          }

        }

      } finally {

        setLoadingAlert(false);

      }

    }, []);

  // ===================================================
  // LOAD ALERT
  // ===================================================

  useEffect(() => {

    getLatestAlert();

  }, [
    getLatestAlert,
  ]);

  // ===================================================
  // GET SAFEST LOCATIONS
  // ===================================================

  const getSafestLocations =
    useCallback(async () => {

      if (!userLocation) {
        return;
      }

      try {

        setLoadingLocations(
          true
        );

        let locations = [];

        // ---------------------------------------------
        // OFFLINE
        // ---------------------------------------------

        if (!isOnline) {

          const savedLocations =
            localStorage.getItem(
              SAFE_LOCATIONS_CACHE_KEY
            );

          if (!savedLocations) {

            setSafestLocations([]);
            setAllSafeLocations([]);

            return;
          }

          locations =
            JSON.parse(
              savedLocations
            );

          setAllSafeLocations(
            Array.isArray(
              locations
            )
              ? locations
              : []
          );

        }

        // ---------------------------------------------
        // ONLINE
        // ---------------------------------------------

        else {

          const response =
            await axios.get(
              `${API_BASE_URL}/safe-locations`,
              {
                timeout: 5000,
              }
            );

          locations =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          setAllSafeLocations(
            locations
          );

          localStorage.setItem(
            SAFE_LOCATIONS_CACHE_KEY,
            JSON.stringify(
              locations
            )
          );

        }

        // ---------------------------------------------
        // REMOVE FOOD AND POLICE FROM
        // SAFEST LOCATION RANKING
        // ---------------------------------------------

        const emergencyLocations =
          locations.filter(
            (location) =>
              !isServiceLocation(
                location
              )
          );

        // ---------------------------------------------
        // CALCULATE STRAIGHT-LINE DISTANCE
        // ---------------------------------------------

        const nearbyLocations =
          emergencyLocations

            .filter(
              (location) =>
                location.latitude != null &&
                location.longitude != null
            )

            .map(
              (location) => ({

                ...location,

                distance:
                  calculateDistanceKm(

                    Number(
                      userLocation.latitude
                    ),

                    Number(
                      userLocation.longitude
                    ),

                    Number(
                      location.latitude
                    ),

                    Number(
                      location.longitude
                    )

                  ),

              })
            )

            .filter(
              (location) =>
                location.distance <=
                MAX_DISTANCE_KM
            );

        // ---------------------------------------------
        // GET ROAD DISTANCES
        // ---------------------------------------------

        let locationsWithRoadDistance =
          [];

        if (isOnline) {

          locationsWithRoadDistance =
            await Promise.all(

              nearbyLocations.map(
                async (location) => {

                  const road =
                    await getRoadDistance(
                      userLocation,
                      location
                    );

                  return {

                    ...location,

                    roadDistance:
                      road?.distance ??
                      null,

                    roadDuration:
                      road?.duration ??
                      null,

                    roadDistanceFromCache:
                      road?.fromCache ??
                      false,

                  };

                }
              )

            );

        } else {

          const roadCache =
            getRoadDistanceCache();

          locationsWithRoadDistance =
            nearbyLocations.map(
              (location) => {

                const key =
                  createRoadDistanceKey(

                    userLocation.latitude,

                    userLocation.longitude,

                    location.latitude,

                    location.longitude

                  );

                const cached =
                  roadCache[key];

                return {

                  ...location,

                  roadDistance:
                    cached &&
                    Number.isFinite(
                      Number(
                        cached.distance
                      )
                    )
                      ? Number(
                          cached.distance
                        )
                      : null,

                  roadDuration:
                    cached &&
                    Number.isFinite(
                      Number(
                        cached.duration
                      )
                    )
                      ? Number(
                          cached.duration
                        )
                      : null,

                  roadDistanceFromCache:
                    Boolean(cached),

                };

              }
            );

        }

        // ---------------------------------------------
        // DISASTER TYPE
        // ---------------------------------------------

        const disasterType =
          normalizeDisasterType(
            alert?.disasterType
          );

        let sortedLocations =
          [];

        // ---------------------------------------------
        // HEAVY RAIN
        // HIGHER ELEVATION FIRST
        // ---------------------------------------------

        if (
          disasterType ===
          "Heavy Rain"
        ) {

          sortedLocations =
            [
              ...locationsWithRoadDistance,
            ].sort(
              (a, b) => {

                const elevationA =
                  Number(
                    a.elevation ??
                      0
                  );

                const elevationB =
                  Number(
                    b.elevation ??
                      0
                  );

                if (
                  elevationA !==
                  elevationB
                ) {

                  return (
                    elevationB -
                    elevationA
                  );

                }

                const distanceA =
                  a.roadDistance ??
                  a.distance;

                const distanceB =
                  b.roadDistance ??
                  b.distance;

                return (
                  distanceA -
                  distanceB
                );

              }
            );

        }

        // ---------------------------------------------
        // EXTREME HEAT
        // ---------------------------------------------

        else if (
          disasterType ===
          "Extreme Heat"
        ) {

          sortedLocations =
            [
              ...locationsWithRoadDistance,
            ].sort(
              (a, b) => {

                const scoreA =
                  getHeatSafetyScore(
                    a
                  );

                const scoreB =
                  getHeatSafetyScore(
                    b
                  );

                if (
                  scoreA !==
                  scoreB
                ) {

                  return (
                    scoreB -
                    scoreA
                  );

                }

                const distanceA =
                  a.roadDistance ??
                  a.distance;

                const distanceB =
                  b.roadDistance ??
                  b.distance;

                return (
                  distanceA -
                  distanceB
                );

              }
            );

        }

        // ---------------------------------------------
        // NO DISASTER
        // ---------------------------------------------

        else {

          sortedLocations =
            [
              ...locationsWithRoadDistance,
            ].sort(
              (a, b) => {

                const distanceA =
                  a.roadDistance ??
                  a.distance;

                const distanceB =
                  b.roadDistance ??
                  b.distance;

                return (
                  distanceA -
                  distanceB
                );

              }
            );

        }

        // ---------------------------------------------
        // REMOVE DUPLICATES
        // ---------------------------------------------

        const uniqueLocations =
          removeDuplicateLocations(
            sortedLocations
          );

        // ---------------------------------------------
        // TOP 5
        // ---------------------------------------------

        const finalLocations =
          uniqueLocations
            .slice(0, 5)
            .map(
              (
                location,
                index
              ) => ({

                ...location,

                rank:
                  index + 1,

                heatSafetyScore:
                  getHeatSafetyScore(
                    location
                  ),

              })
            );

        setSafestLocations(
          finalLocations
        );

      } catch (error) {

        console.error(
          "Safe location error:",
          error
        );

        try {

          const savedLocations =
            localStorage.getItem(
              SAFE_LOCATIONS_CACHE_KEY
            );

          if (!savedLocations) {

            setSafestLocations([]);

            return;

          }

          const cachedLocations =
            JSON.parse(
              savedLocations
            );

          setAllSafeLocations(
            Array.isArray(
              cachedLocations
            )
              ? cachedLocations
              : []
          );

          const roadCache =
            getRoadDistanceCache();

          const nearby =
            cachedLocations

              .filter(
                (location) =>
                  !isServiceLocation(
                    location
                  )
              )

              .filter(
                (location) =>
                  location.latitude != null &&
                  location.longitude != null
              )

              .map(
                (location) => {

                  const distance =
                    calculateDistanceKm(

                      Number(
                        userLocation.latitude
                      ),

                      Number(
                        userLocation.longitude
                      ),

                      Number(
                        location.latitude
                      ),

                      Number(
                        location.longitude
                      )

                    );

                  const key =
                    createRoadDistanceKey(

                      userLocation.latitude,

                      userLocation.longitude,

                      location.latitude,

                      location.longitude

                    );

                  const cachedRoad =
                    roadCache[key];

                  return {

                    ...location,

                    distance,

                    roadDistance:
                      cachedRoad &&
                      Number.isFinite(
                        Number(
                          cachedRoad.distance
                        )
                      )
                        ? Number(
                            cachedRoad.distance
                          )
                        : null,

                    roadDuration:
                      cachedRoad &&
                      Number.isFinite(
                        Number(
                          cachedRoad.duration
                        )
                      )
                        ? Number(
                            cachedRoad.duration
                          )
                        : null,

                  };

                }
              )

              .filter(
                (location) =>
                  location.distance <=
                  MAX_DISTANCE_KM
              )

              .sort(
                (a, b) => {

                  const distanceA =
                    a.roadDistance ??
                    a.distance;

                  const distanceB =
                    b.roadDistance ??
                    b.distance;

                  return (
                    distanceA -
                    distanceB
                  );

                }
              );

          const unique =
            removeDuplicateLocations(
              nearby
            );

          setSafestLocations(

            unique
              .slice(0, 5)
              .map(
                (
                  location,
                  index
                ) => ({

                  ...location,

                  rank:
                    index + 1,

                  heatSafetyScore:
                    getHeatSafetyScore(
                      location
                    ),

                })
              )

          );

        } catch {

          setSafestLocations([]);

        }

      } finally {

        setLoadingLocations(
          false
        );

      }

    }, [
      userLocation,
      alert,
      isOnline,
    ]);

  // ===================================================
  // LOAD SAFE LOCATIONS
  // ===================================================

  useEffect(() => {

    getSafestLocations();

  }, [
    getSafestLocations,
  ]);

  // ===================================================
  // LOAD CACHED WEATHER
  // ===================================================

  const loadCachedWeather =
    useCallback(() => {

      try {

        const savedWeather =
          localStorage.getItem(
            WEATHER_CACHE_KEY
          );

        const savedTime =
          localStorage.getItem(
            WEATHER_CACHE_TIME_KEY
          );

        if (savedWeather) {

          const parsedWeather =
            JSON.parse(
              savedWeather
            );

          setWeather(
            parsedWeather
          );

          if (savedTime) {

            setWeatherLastUpdated(
              new Date(savedTime)
            );

          }

          return true;

        }

      } catch (error) {

        console.error(
          "Cached weather loading error:",
          error
        );

      }

      return false;

    }, []);

  // ===================================================
  // GET WEATHER
  // ===================================================

  const getWeather =
    useCallback(async () => {

      if (!userLocation) {
        return;
      }

      if (!isOnline) {

        setLoadingWeather(false);

        loadCachedWeather();

        return;

      }

      try {

        setLoadingWeather(true);

        const response =
          await axios.get(
            `${API_BASE_URL}/weather`,
            {
              params: {

                latitude:
                  userLocation.latitude,

                longitude:
                  userLocation.longitude,

              },

              timeout: 5000,
            }
          );

        const weatherData =
          response.data;

        setWeather(
          weatherData
        );

        localStorage.setItem(
          WEATHER_CACHE_KEY,
          JSON.stringify(
            weatherData
          )
        );

        const updatedAt =
          new Date().toISOString();

        localStorage.setItem(
          WEATHER_CACHE_TIME_KEY,
          updatedAt
        );

        setWeatherLastUpdated(
          new Date(updatedAt)
        );

      } catch (error) {

        console.error(
          "Weather error:",
          error
        );

        loadCachedWeather();

      } finally {

        setLoadingWeather(false);

      }

    }, [
      userLocation,
      isOnline,
      loadCachedWeather,
    ]);

  // ===================================================
  // LOAD WEATHER
  // ===================================================

  useEffect(() => {

    getWeather();

  }, [
    getWeather,
  ]);

  // ===================================================
  // REFRESH WEATHER WHEN INTERNET RETURNS
  // ===================================================

  useEffect(() => {

    const handleOnline =
      () => {

        setIsOnline(true);

      };

    const handleOffline =
      () => {

        setIsOnline(false);

        loadCachedWeather();

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

  }, [
    loadCachedWeather,
  ]);

  // ===================================================
  // WEATHER VALUES
  // ===================================================

  const temperature =
    weather?.temperature ??
    weather?.main?.temp ??
    null;

  const humidity =
    weather?.humidity ??
    weather?.main?.humidity ??
    null;

  const windSpeed =
    weather?.windSpeed ??
    weather?.wind?.speed ??
    null;

  const weatherDescription =
    weather?.description ??
    weather?.weather?.[0]
      ?.description ??
    null;

  // ===================================================
  // CURRENT DISASTER
  // ===================================================

  const currentDisaster =
    alert?.disasterType
      ? normalizeDisasterType(
          alert.disasterType
        )
      : null;

  // ===================================================
  // CURRENT WEATHER CONDITION
  // ===================================================

  const weatherCondition =
    getWeatherCondition(
      weather,
      currentDisaster
    );

  // ===================================================
  // FOOD SERVICES
  // ===================================================

  const foodServices =
    allSafeLocations
      .filter(
        (location) =>
          normalizeServiceType(
            location?.type
          ) === "FOOD"
      )
      .filter(
        (location) =>
          userLocation &&
          location.latitude != null &&
          location.longitude != null &&
          calculateDistanceKm(

            Number(
              userLocation.latitude
            ),

            Number(
              userLocation.longitude
            ),

            Number(
              location.latitude
            ),

            Number(
              location.longitude
            )

          ) <= MAX_DISTANCE_KM
      );

  // ===================================================
  // POLICE SERVICES
  // ===================================================

  const policeServices =
    allSafeLocations
      .filter(
        (location) =>
          normalizeServiceType(
            location?.type
          ) === "POLICE"
      )
      .filter(
        (location) =>
          userLocation &&
          location.latitude != null &&
          location.longitude != null &&
          calculateDistanceKm(

            Number(
              userLocation.latitude
            ),

            Number(
              userLocation.longitude
            ),

            Number(
              location.latitude
            ),

            Number(
              location.longitude
            )

          ) <= MAX_DISTANCE_KM
      );

  // ===================================================
  // OPEN SECOND MAP
  // ===================================================

  const openOfflineMap =
    (location) => {

      setSelectedOfflineLocation({
        ...location,
      });

      setTimeout(() => {

        const mapSection =
          document.querySelector(
            ".offline-map-section"
          );

        if (mapSection) {

          mapSection.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        }

      }, 200);

    };

  // ===================================================
  // CLOSE SECOND MAP
  // ===================================================

  const closeOfflineMap =
    () => {

      setSelectedOfflineLocation(
        null
      );

    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="dashboard">

      <header className="dashboard-header">

        <div className="dashboard-brand">

          <div className="brand-icon">
            🚨
          </div>

          <div>

            <h1>
              Disaster Alert
            </h1>

            <span>
              Emergency Safety Dashboard
            </span>

          </div>

        </div>

        <div
          className={`connection-status ${
            isOnline
              ? "online"
              : "offline"
          }`}
        >

          <span className="status-dot"></span>

          {isOnline
            ? "Online"
            : "Offline"}

        </div>

      </header>

      <main className="dashboard-content">

        <section className="welcome-section">

          <div>

            <div className="welcome-label">
              SAFETY CENTER
            </div>

            <h2>
              Stay Alert. Stay Safe.
            </h2>

            <p>
              Get disaster alerts,
              weather information,
              your current location
              and the safest emergency
              locations within 2 km.
            </p>

          </div>

          <div className="location-badge">

            📍{" "}

            {userLocation
              ? "Location detected"
              : "Location unavailable"}

          </div>

          <button
            type="button"
            onClick={enableFirebaseNotifications}
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🔔 Enable Notifications
          </button>

        </section>

        {!isOnline && (

          <section className="offline-alert">

            <div className="offline-icon">
              📡
            </div>

            <div>

              <strong>
                You are currently offline
              </strong>

              <p>
                Cached disaster,
                weather and safe-location
                information is being used.
              </p>

            </div>

          </section>

        )}

        <div className="dashboard-main-grid">

          <aside className="dashboard-sidebar">

        {loadingAlert ? (

          <section className="disaster-alert">

            <div className="alert-icon">
              ⏳
            </div>

            <div className="alert-content">

              <h2>
                Loading disaster alert...
              </h2>

            </div>

          </section>

        ) : alert ? (

          <section className="disaster-alert">

            <div className="alert-icon">
              🚨
            </div>

            <div className="alert-content">

              <div className="alert-label">
                ACTIVE DISASTER ALERT
              </div>

              <h2>
                {alert.title ||
                  alert.disasterType ||
                  "Disaster Alert"}
              </h2>

              <p>
                {alert.message ||
                  "Please follow safety instructions."}
              </p>

              <div className="alert-details">

                {alert.disasterType && (

                  <span>
                    🌪️{" "}
                    {alert.disasterType}
                  </span>

                )}

                {alert.severity && (

                  <span>
                    ⚠️ Severity:{" "}
                    {alert.severity}
                  </span>

                )}

                {alert.location && (

                  <span>
                    📍{" "}
                    {alert.location}
                  </span>

                )}

              </div>

            </div>

            <div className="alert-status">
              ACTIVE
            </div>

          </section>

        ) : (

          <section className="safe-alert">

            <div className="safe-alert-icon">
              ✅
            </div>

            <div>

              <h3>
                No Active Disaster Alert
              </h3>

              <p>
                No active disaster
                alert has been reported.
              </p>

            </div>

          </section>

        )}

        {/* =================================================
            SOS EMERGENCY BUTTON
        ================================================= */}


        <section className="sos-panel">
          <SOSButton />
        </section>

        <section className="weather-section">

          <div className="section-title">

            <div>

              <h2>
                🌤️ Current Weather
              </h2>

              <p>
                Weather conditions near
                your location
              </p>

            </div>

            {isOnline && weather && (

              <span className="live-badge">
                LIVE
              </span>

            )}

          </div>

          {loadingWeather ? (

            <div className="weather-loading">
              Loading weather information...
            </div>

          ) : weather ? (

            <>

              <div className="weather-grid">

                <div className="weather-main">

                  <div className="weather-icon">
                    🌤️
                  </div>

                  <div>

                    <span>
                      Temperature
                    </span>

                    <strong>

                      {temperature != null
                        ? `${temperature}°C`
                        : "—"}

                    </strong>

                    <small>

                      {weatherDescription ||
                        "Current conditions"}

                    </small>

                  </div>

                </div>

                <div className="weather-item">

                  <span>
                    💧 Humidity
                  </span>

                  <strong>

                    {humidity != null
                      ? `${humidity}%`
                      : "—"}

                  </strong>

                </div>

                <div className="weather-item">

                  <span>
                    💨 Wind
                  </span>

                  <strong>

                    {windSpeed != null
                      ? windSpeed
                      : "—"}

                  </strong>

                </div>

              </div>

              <div className="weather-condition-card">

                <span>
                  Safety condition
                </span>

                <strong>
                  {weatherCondition}
                </strong>

              </div>

              {weatherLastUpdated && (

                <div
                  className="weather-last-updated"
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >

                  {isOnline
                    ? "✓ Last updated: "
                    : "📡 Offline • Last updated: "}

                  {formatWeatherTime(
                    weatherLastUpdated
                  )}

                </div>

              )}

            </>

          ) : (

            <div className="weather-placeholder">

              <div className="weather-placeholder-icon">
                🌤️
              </div>

              <h3>
                Weather unavailable
              </h3>

              <p>

                {isOnline
                  ? "Weather information will appear when available."
                  : "No previously saved weather data is available. Connect to the internet once to load weather information."}

              </p>

            </div>

          )}

        </section>

        {/* =================================================
            LOCATION
        ================================================= */}

        <section className="location-card">

          <div className="location-icon">
            📍
          </div>

          <div className="location-info">

            <span>
              YOUR CURRENT LOCATION
            </span>

            {userLocation ? (

              <p>

                {Number(
                  userLocation.latitude
                ).toFixed(6)}

                {" , "}

                {Number(
                  userLocation.longitude
                ).toFixed(6)}

              </p>

            ) : (

              <p>
                Location not available
              </p>

            )}

          </div>

          <div
            className={`location-status ${
              userLocation
                ? "current"
                : "saved"
            }`}
          >

            {userLocation
              ? "Available"
              : "Unavailable"}

          </div>

          <button
            type="button"
            className="map-button"
            onClick={getLocation}
          >
            📍 Update
          </button>

        </section>

        {/* =================================================
            MAIN MAP
        ================================================= */}


          </aside>

        <section className="map-section">

          <div className="section-title">

            <div>

              <h2>
                🗺️ Safety Map
              </h2>

              <p>
                Your location, safest
                locations and emergency
                services
              </p>

            </div>

            <span className="radius-badge">
              2 KM RADIUS
            </span>

          </div>

          <div className="map-container">

            <DisasterMap

              key="main-safety-map"

              userLocation={
                userLocation
              }

              shelters={
                safestLocations
              }

              safestLocations={
                safestLocations
              }

              foodServices={
                foodServices
              }

              policeServices={
                policeServices
              }

              weatherCondition={
                weatherCondition
              }

              selectedShelter={
                selectedShelter
              }

              onShelterClick={
                setSelectedShelter
              }

              offlineMode={false}

            />

          </div>

        </section>


        </div>

        {/* =================================================
            SAFEST LOCATIONS
        ================================================= */}

        <section className="safest-section">

          <div className="section-title">

            <div>

              <div className="section-heading-row">

                <h2>
                  🛡️ Safest Locations
                </h2>

                <span className="recommended-badge">
                  RECOMMENDED
                </span>

              </div>

              <p>

                {currentDisaster
                  ? `Best locations for ${currentDisaster} within 2 km`
                  : "Best emergency locations within 2 km"}

              </p>

            </div>

          </div>

          <div className="safety-explanation">

            <div className="safety-explanation-icon">
              ⭐
            </div>

            <div>

              <strong>
                How are safe locations selected?
              </strong>

              <p>

                {currentDisaster ===
                "Heavy Rain"

                  ? "Higher-elevation locations are prioritized because they can reduce flood exposure."

                  : currentDisaster ===
                    "Extreme Heat"

                  ? "Hospitals, shelters, schools and community facilities are prioritized for heat emergencies."

                  : "The nearest registered emergency locations within 2 km are recommended."}

              </p>

            </div>

          </div>

          {loadingLocations ? (

            <div className="empty-state">

              <div>
                ⏳
              </div>

              <h3>
                Finding safest locations...
              </h3>

              <p>
                Searching within a 2 km radius.
              </p>

            </div>

          ) : safestLocations.length === 0 ? (

            <div className="empty-state">

              <div>
                🛡️
              </div>

              <h3>
                No safe locations found
              </h3>

              <p>
                No registered emergency
                facility was found within
                2 km of your location.
              </p>

            </div>

          ) : (

            <div className="safest-grid">

              {safestLocations.map(
                (location, index) => (

                  <div
                    className={`safest-location-card ${
                      index === 0
                        ? "top-safe"
                        : ""
                    }`}
                    key={
                      location.id ??
                      `${location.name}-${location.latitude}-${location.longitude}`
                    }
                  >

                    <div className="rank-circle">
                      {index + 1}
                    </div>

                    <div className="safe-card-icon">
                      🛡️
                    </div>

                    <div className="safe-card-content">

                      <div className="safe-card-title">

                        <h3>
                          {location.name ||
                            "Safe Location"}
                        </h3>

                        {index === 0 && (

                          <span>
                            BEST OPTION
                          </span>

                        )}

                      </div>

                      <div className="location-type">

                        {location.type ||
                          "Emergency Facility"}

                      </div>

                      <div className="safe-metrics">

                        <div>

                          <span>
                            Road Distance
                          </span>

                          <strong>

                            {formatDistance(
                              location.roadDistance ??
                              location.distance
                            )}

                          </strong>

                        </div>

                        {location.capacity !=
                          null && (

                          <div>

                            <span>
                              Capacity
                            </span>

                            <strong>
                              {location.capacity}
                            </strong>

                          </div>

                        )}

                        {location.elevation !=
                          null && (

                          <div>

                            <span>
                              Elevation
                            </span>

                            <strong>
                              {location.elevation} m
                            </strong>

                          </div>

                        )}

                      </div>

                      {location.roadDistance !=
                        null &&
                        location.distance !=
                          null && (

                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >

                          Straight-line distance:{" "}

                          {formatDistance(
                            location.distance
                          )}

                        </div>

                      )}

                      {currentDisaster ===
                        "Extreme Heat" && (

                        <div className="heat-score">

                          ☀️ Heat Safety Score:{" "}

                          <strong>
                            {location.heatSafetyScore}
                          </strong>

                        </div>

                      )}

                      {location.address && (

                        <p className="safe-address">

                          🏠{" "}
                          {location.address}

                        </p>

                      )}

                      <button
                        type="button"
                        className="safe-route-button"
                        onClick={() =>
                          openOfflineMap(
                            location
                          )
                        }
                      >
                        🗺️ View Offline Map
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =================================================
            SECOND MAP
        ================================================= */}

        {selectedOfflineLocation && (

          <section className="offline-map-section">

            <div className="section-title">

              <div>

                <div className="section-heading-row">

                  <h2>
                    📍 Offline Map
                  </h2>

                  <span className="offline-map-badge">
                    ONLINE + OFFLINE
                  </span>

                </div>

                <p>

                  Map for{" "}

                  <strong>
                    {
                      selectedOfflineLocation.name
                    }
                  </strong>

                </p>

              </div>

              <button
                type="button"
                className="close-map-button"
                onClick={closeOfflineMap}
              >
                ✕ Close Map
              </button>

            </div>

            <div className="offline-map-info">

              <div className="offline-location-details">

                <div className="offline-location-icon">
                  🛡️
                </div>

                <div>

                  <h3>
                    {
                      selectedOfflineLocation.name
                    }
                  </h3>

                  <span>

                    {
                      selectedOfflineLocation.type ||
                      "Emergency Facility"
                    }

                  </span>

                </div>

              </div>

              <div className="offline-location-distance">

                <span>
                  Road Distance
                </span>

                <strong>

                  {formatDistance(
                    selectedOfflineLocation.roadDistance ??
                    selectedOfflineLocation.distance
                  )}

                </strong>

              </div>

              {selectedOfflineLocation.capacity !=
                null && (

                <div className="offline-location-distance">

                  <span>
                    Capacity
                  </span>

                  <strong>
                    {
                      selectedOfflineLocation.capacity
                    }
                  </strong>

                </div>

              )}

              {selectedOfflineLocation.elevation !=
                null && (

                <div className="offline-location-distance">

                  <span>
                    Elevation
                  </span>

                  <strong>
                    {
                      selectedOfflineLocation.elevation
                    }{" "}
                    m
                  </strong>

                </div>

              )}

            </div>

            <div className="offline-map-container">

              <DisasterMap

                key={`offline-map-${
                  selectedOfflineLocation.id ??
                  selectedOfflineLocation.name
                }`}

                userLocation={
                  userLocation
                }

                shelters={[
                  selectedOfflineLocation
                ]}

                safestLocations={[
                  selectedOfflineLocation
                ]}

                foodServices={
                  foodServices
                }

                policeServices={
                  policeServices
                }

                weatherCondition={
                  weatherCondition
                }

                selectedShelter={
                  selectedOfflineLocation
                }

                onShelterClick={() => {}}

                offlineMode={true}

              />

            </div>

            <div className="offline-map-notice">

              <div className="offline-notice-icon">
                📡
              </div>

              <div>

                <strong>
                  Online + Offline Map
                </strong>

                <p>

                  When internet is available,
                  the map uses OpenStreetMap
                  and road routing.
                  When internet is unavailable,
                  previously cached map tiles
                  and routes can be used.

                </p>

              </div>

            </div>

          </section>

        )}

        {/* =================================================
            EMERGENCY RESOURCES
        ================================================= */}

        <section className="resources-section">

          <div className="section-title">

            <div>

              <h2>
                📞 Emergency Resources
              </h2>

              <p>
                Important emergency contacts
              </p>

            </div>

          </div>

          <div className="resource-grid">

            <div className="resource-card">

              <div className="resource-icon">
                🚨
              </div>

              <div>

                <h3>
                  Emergency
                </h3>

                <p>
                  National emergency number
                </p>

                <a href="tel:112">
                  Call 112
                </a>

              </div>

            </div>

            <div className="resource-card">

              <div className="resource-icon">
                🚒
              </div>

              <div>

                <h3>
                  Fire & Rescue
                </h3>

                <p>
                  Fire emergency services
                </p>

                <a href="tel:101">
                  Call 101
                </a>

              </div>

            </div>

            <div className="resource-card">

              <div className="resource-icon">
                🚑
              </div>

              <div>

                <h3>
                  Ambulance
                </h3>

                <p>
                  Medical emergency
                </p>

                <a href="tel:108">
                  Call 108
                </a>

              </div>

            </div>

            <div className="resource-card">

              <div className="resource-icon">
                👮
              </div>

              <div>

                <h3>
                  Police
                </h3>

                <p>
                  Police emergency service
                </p>

                <a href="tel:100">
                  Call 100
                </a>

              </div>

            </div>

          </div>

        </section>

      </main>

      <footer className="dashboard-footer">

        <div className="footer-brand">
          🛡️ Disaster Alert System
        </div>

        <p>
          Stay Alert • Stay Safe • Stay Prepared
        </p>

        <span>
          Emergency information system
        </span>

      </footer>

    </div>
  );
}

export default Dashboard;
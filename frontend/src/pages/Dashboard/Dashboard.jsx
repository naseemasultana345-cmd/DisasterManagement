// ============================================================
// Dashboard.jsx
// Disaster Management / DisasterSafe
// Updated dashboard UI based on the provided reference design
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  Ambulance,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  Flame,
  Gauge,
  Globe2,
  Home,
  Info,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Siren,
  Thermometer,
  User,
  Users,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import DisasterMap from "../../components/DisasterMap/DisasterMap";

import "./Dashboard.css";

// ============================================================
// CONSTANTS
// ============================================================

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

const MAX_DISTANCE_KM = 2;

const WEATHER_CACHE_KEY = "lastWeather";
const ALERT_CACHE_KEY = "lastDisasterAlert";
const SHELTER_CACHE_KEY = "lastShelters";
const USER_LOCATION_KEY = "lastUserLocation";

const EMERGENCY_NUMBERS = {
  emergency: "112",
  fire: "101",
  ambulance: "108",
  police: "100",
};

// ============================================================
// HELPERS
// ============================================================

const safeJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getStoredJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const setStoredJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
};

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
};

const getCurrentUser = () => {
  const possibleKeys = [
    "user",
    "currentUser",
    "loggedInUser",
    "userData",
  ];

  for (const key of possibleKeys) {
    try {
      const value =
        localStorage.getItem(key) ||
        sessionStorage.getItem(key);

      if (value) {
        const parsed = JSON.parse(value);

        if (parsed) {
          return parsed;
        }
      }
    } catch {
      // Continue.
    }
  }

  return null;
};

const apiFetch = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

const firstDefined = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

const numberValue = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const formatDistance = (distance) => {
  const km = numberValue(distance, 0);

  if (km < 1) {
    return `${Math.max(Math.round(km * 1000), 1)} m away`;
  }

  return `${km.toFixed(1)} km away`;
};

const formatElevation = (value) => {
  const elevation = numberValue(value, 0);

  return `Elev. ${Math.round(elevation)} m`;
};

const calculateDistanceKm = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  const latitude1 = Number(lat1);
  const longitude1 = Number(lon1);
  const latitude2 = Number(lat2);
  const longitude2 = Number(lon2);

  if (
    !Number.isFinite(latitude1) ||
    !Number.isFinite(longitude1) ||
    !Number.isFinite(latitude2) ||
    !Number.isFinite(longitude2)
  ) {
    return null;
  }

  const earthRadius = 6371;

  const dLat =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const dLon =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const normalizeWeather = (data) => {
  if (!data) {
    return null;
  }

  const source =
    data.data ||
    data.weather ||
    data.result ||
    data;

  return {
    city:
      firstDefined(
        source.city,
        source.location,
        source.name,
        "Tirupati"
      ) || "Tirupati",

    temperature: numberValue(
      firstDefined(
        source.temperature,
        source.temp,
        source.tempC,
        source.temperatureC
      ),
      30
    ),

    condition:
      firstDefined(
        source.condition,
        source.description,
        source.weatherDescription,
        source.weather
      ) || "Weather information unavailable",

    humidity: numberValue(
      firstDefined(
        source.humidity,
        source.humidityPercent
      ),
      0
    ),

    windSpeed: numberValue(
      firstDefined(
        source.windSpeed,
        source.wind,
        source.windKph,
        source.windSpeedKph
      ),
      0
    ),

    visibility: numberValue(
      firstDefined(
        source.visibility,
        source.visibilityKm
      ),
      0
    ),

    icon:
      firstDefined(
        source.icon,
        source.weatherIcon
      ) || null,

    updatedAt:
      firstDefined(
        source.updatedAt,
        source.lastUpdated,
        source.time
      ) || null,
  };
};

const normalizeAlert = (data) => {
  if (!data) {
    return null;
  }

  const source =
    data.data ||
    data.alert ||
    data.result ||
    data;

  return {
    id:
      firstDefined(
        source.id,
        source.alertId
      ) || null,

    title:
      firstDefined(
        source.title,
        source.name,
        source.alertType,
        source.disasterType
      ) || "Disaster Alert",

    disasterType:
      firstDefined(
        source.disasterType,
        source.type,
        source.alertType
      ) || "Emergency",

    location:
      firstDefined(
        source.location,
        source.city,
        source.area
      ) || "Your Area",

    severity:
      firstDefined(
        source.severity,
        source.level,
        source.alertLevel
      ) || "High",

    message:
      firstDefined(
        source.message,
        source.description,
        source.details
      ) || "Please stay alert and follow safety instructions.",

    active:
      source.active !== undefined
        ? Boolean(source.active)
        : true,
  };
};

const normalizeShelter = (item, index = 0) => {
  const latitude = firstDefined(
    item.latitude,
    item.lat,
    item.location?.latitude,
    item.location?.lat
  );

  const longitude = firstDefined(
    item.longitude,
    item.lng,
    item.lon,
    item.location?.longitude,
    item.location?.lng
  );

  return {
    ...item,

    id:
      firstDefined(
        item.id,
        item.safeLocationId,
        item.shelterId
      ) || `shelter-${index}`,

    name:
      firstDefined(
        item.name,
        item.locationName,
        item.shelterName
      ) || "Safe Shelter",

    address:
      firstDefined(
        item.address,
        item.locationAddress,
        item.area
      ) || "Nearby safe location",

    latitude:
      latitude !== null
        ? Number(latitude)
        : null,

    longitude:
      longitude !== null
        ? Number(longitude)
        : null,

    beds: numberValue(
      firstDefined(
        item.availableBeds,
        item.bedsAvailable,
        item.capacityAvailable,
        item.capacity,
        item.beds
      ),
      0
    ),

    elevation: numberValue(
      firstDefined(
        item.elevation,
        item.elevationMeters,
        item.altitude
      ),
      0
    ),

    image:
      firstDefined(
        item.image,
        item.imageUrl,
        item.photo,
        item.photoUrl
      ) || null,

    distanceKm:
      firstDefined(
        item.distanceKm,
        item.distance,
        item.roadDistanceKm
      ) !== null
        ? numberValue(
            firstDefined(
              item.distanceKm,
              item.distance,
              item.roadDistanceKm
            ),
            0
          )
        : null,
  };
};

// ============================================================
// COMPONENT
// ============================================================

export default function Dashboard() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(() =>
    getCurrentUser()
  );

  const [online, setOnline] = useState(
    navigator.onLine
  );

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [alert, setAlert] = useState(() =>
    normalizeAlert(
      getStoredJson(ALERT_CACHE_KEY)
    )
  );

  const [weather, setWeather] = useState(() =>
    normalizeWeather(
      getStoredJson(WEATHER_CACHE_KEY)
    )
  );

  const [shelters, setShelters] = useState(() =>
    getStoredJson(SHELTER_CACHE_KEY, []).map(
      (item, index) =>
        normalizeShelter(item, index)
    )
  );

  const [location, setLocation] = useState(() =>
    getStoredJson(USER_LOCATION_KEY)
  );

  const [loadingShelters, setLoadingShelters] =
    useState(false);

  const [loadingWeather, setLoadingWeather] =
    useState(false);

  const [loadingAlert, setLoadingAlert] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [sosLoading, setSosLoading] =
    useState(false);

  const [sosPressed, setSosPressed] =
    useState(false);

  const [showAlert, setShowAlert] =
    useState(true);

  const [mapMode, setMapMode] =
    useState("map");

  const [selectedShelter, setSelectedShelter] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const sosTimerRef = useRef(null);

  // ==========================================================
  // USER
  // ==========================================================

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // ==========================================================
  // ONLINE / OFFLINE
  // ==========================================================

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
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

  // ==========================================================
  // GET USER LOCATION
  // ==========================================================

  const getUserLocation = useCallback(
    (silent = false) => {
      if (!navigator.geolocation) {
        if (!silent) {
          setErrorMessage(
            "Location services are not supported by this browser."
          );
        }

        return;
      }

      if (!silent) {
        setLocationLoading(true);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(newLocation);

          setStoredJson(
            USER_LOCATION_KEY,
            newLocation
          );

          setLocationLoading(false);
          setErrorMessage("");
        },

        () => {
          setLocationLoading(false);

          if (!silent) {
            setErrorMessage(
              "Unable to get your current location. Please allow location access."
            );
          }
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    },
    []
  );

  useEffect(() => {
    getUserLocation(true);
  }, [getUserLocation]);

  // ==========================================================
  // FETCH ALERT
  // ==========================================================

  const fetchAlert = useCallback(
    async (silent = false) => {
      if (!online) {
        return;
      }

      if (!silent) {
        setLoadingAlert(true);
      }

      try {
        const response = await apiFetch(
          `${API_BASE}/disaster-alert/latest`
        );

        if (!response.ok) {
          throw new Error(
            `Alert request failed: ${response.status}`
          );
        }

        const data = await safeJson(response);

        const normalized =
          normalizeAlert(data);

        if (normalized) {
          setAlert(normalized);

          setStoredJson(
            ALERT_CACHE_KEY,
            normalized
          );
        }

        setErrorMessage("");
      } catch (error) {
        console.error(
          "Failed to load disaster alert:",
          error
        );
      } finally {
        if (!silent) {
          setLoadingAlert(false);
        }
      }
    },
    [online]
  );

  // ==========================================================
  // FETCH WEATHER
  // ==========================================================

  const fetchWeather = useCallback(
    async (silent = false) => {
      if (!online) {
        return;
      }

      if (!silent) {
        setLoadingWeather(true);
      }

      try {
        let url = `${API_BASE}/weather`;

        if (location?.latitude && location?.longitude) {
          url +=
            `?lat=${encodeURIComponent(
              location.latitude
            )}` +
            `&lon=${encodeURIComponent(
              location.longitude
            )}`;
        }

        const response = await apiFetch(url);

        if (!response.ok) {
          throw new Error(
            `Weather request failed: ${response.status}`
          );
        }

        const data = await safeJson(response);

        const normalized =
          normalizeWeather(data);

        if (normalized) {
          setWeather(normalized);

          setStoredJson(
            WEATHER_CACHE_KEY,
            normalized
          );
        }
      } catch (error) {
        console.error(
          "Failed to load weather:",
          error
        );
      } finally {
        if (!silent) {
          setLoadingWeather(false);
        }
      }
    },
    [
      online,
      location?.latitude,
      location?.longitude,
    ]
  );

  // ==========================================================
  // FETCH SAFE LOCATIONS
  // ==========================================================

  const fetchShelters = useCallback(
    async (silent = false) => {
      if (!online) {
        return;
      }

      if (!silent) {
        setLoadingShelters(true);
      }

      try {
        let url = `${API_BASE}/safe-locations`;

        if (
          location?.latitude !== undefined &&
          location?.longitude !== undefined
        ) {
          url =
            `${API_BASE}/safe-locations/nearby` +
            `?latitude=${encodeURIComponent(
              location.latitude
            )}` +
            `&longitude=${encodeURIComponent(
              location.longitude
            )}` +
            `&radius=${MAX_DISTANCE_KM}`;
        }

        const response = await apiFetch(url);

        if (!response.ok) {
          throw new Error(
            `Shelter request failed: ${response.status}`
          );
        }

        const data = await safeJson(response);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.safeLocations)
          ? data.safeLocations
          : Array.isArray(data?.shelters)
          ? data.shelters
          : [];

        const normalized = list.map(
          (item, index) =>
            normalizeShelter(item, index)
        );

        setShelters(normalized);

        setStoredJson(
          SHELTER_CACHE_KEY,
          normalized
        );
      } catch (error) {
        console.error(
          "Failed to load safe locations:",
          error
        );
      } finally {
        if (!silent) {
          setLoadingShelters(false);
        }
      }
    },
    [
      online,
      location?.latitude,
      location?.longitude,
    ]
  );

  // ==========================================================
  // INITIAL DATA
  // ==========================================================

  useEffect(() => {
    fetchAlert(true);
  }, [fetchAlert]);

  useEffect(() => {
    fetchWeather(true);
  }, [fetchWeather]);

  useEffect(() => {
    fetchShelters(true);
  }, [fetchShelters]);

  // ==========================================================
  // PERIODIC ALERT REFRESH
  // ==========================================================

  useEffect(() => {
    if (!online) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchAlert(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [online, fetchAlert]);

  // ==========================================================
  // PERIODIC LOCATION UPDATE
  // ==========================================================

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    const interval = setInterval(() => {
      getUserLocation(true);
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [getUserLocation]);

  // ==========================================================
  // CALCULATE SHELTER DISTANCES
  // ==========================================================

  const sheltersWithDistance = useMemo(() => {
    return shelters
      .map((shelter) => {
        let distance = shelter.distanceKm;

        if (
          location?.latitude !== undefined &&
          location?.longitude !== undefined &&
          shelter.latitude !== null &&
          shelter.longitude !== null
        ) {
          const straightLineDistance =
            calculateDistanceKm(
              location.latitude,
              location.longitude,
              shelter.latitude,
              shelter.longitude
            );

          if (
            distance === null ||
            distance === undefined
          ) {
            distance = straightLineDistance;
          }
        }

        return {
          ...shelter,
          calculatedDistanceKm: distance,
        };
      })
      .sort((a, b) => {
        const distanceA =
          a.calculatedDistanceKm ??
          Number.MAX_SAFE_INTEGER;

        const distanceB =
          b.calculatedDistanceKm ??
          Number.MAX_SAFE_INTEGER;

        return distanceA - distanceB;
      });
  }, [shelters, location]);

  // ==========================================================
  // DISPLAY ONLY SAFE LOCATIONS WITHIN 2 KM
  // ==========================================================

  const nearbyShelters = useMemo(() => {
    const available =
      sheltersWithDistance.filter((shelter) => {
        const distance =
          shelter.calculatedDistanceKm;

        if (
          distance === null ||
          distance === undefined
        ) {
          return true;
        }

        return distance <= MAX_DISTANCE_KM;
      });

    return available.slice(0, 3);
  }, [sheltersWithDistance]);

  // ==========================================================
  // DIRECTIONS
  // ==========================================================

  const openDirections = useCallback(
    (shelter) => {
      if (!shelter) {
        return;
      }

      if (
        shelter.latitude !== null &&
        shelter.longitude !== null
      ) {
        const destination =
          `${shelter.latitude},${shelter.longitude}`;

        let origin = "";

        if (
          location?.latitude !== undefined &&
          location?.longitude !== undefined
        ) {
          origin =
            `${location.latitude},${location.longitude}`;
        }

        const url = origin
          ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
              origin
            )}&destination=${encodeURIComponent(
              destination
            )}&travelmode=driving`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              destination
            )}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      if (shelter.address) {
        const url =
          `https://www.google.com/maps/search/?api=1&query=` +
          encodeURIComponent(
            shelter.address
          );

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    },
    [location]
  );

  // ==========================================================
  // REFRESH ALL
  // ==========================================================

  const refreshDashboard = async () => {
    setRefreshing(true);

    try {
      getUserLocation(true);

      await Promise.all([
        fetchAlert(false),
        fetchWeather(false),
        fetchShelters(false),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================================
  // SOS
  // ==========================================================

  const submitSOS = async () => {
    if (sosLoading) {
      return;
    }

    setSosLoading(true);

    const payload = {
      latitude:
        location?.latitude ?? null,

      longitude:
        location?.longitude ?? null,

      emergencyType: "GENERAL",

      status: "PENDING",

      assignedService: "EMERGENCY",

      userId:
        user?.id ??
        user?.userId ??
        null,
    };

    try {
      if (online) {
        const response = await apiFetch(
          `${API_BASE}/sos`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(
            `SOS request failed: ${response.status}`
          );
        }

        try {
          await safeJson(response);
        } catch {
          // Ignore empty response.
        }
      } else {
        const pendingSOS =
          getStoredJson(
            "pendingSOSRequests",
            []
          );

        pendingSOS.push({
          ...payload,
          createdAt:
            new Date().toISOString(),
          offline: true,
        });

        setStoredJson(
          "pendingSOSRequests",
          pendingSOS
        );
      }

      alert(
        online
          ? "SOS request sent successfully."
          : "SOS saved offline. It will be sent when internet connection returns."
      );
    } catch (error) {
      console.error(
        "SOS submission failed:",
        error
      );

      // Save SOS locally even if server fails.
      const pendingSOS =
        getStoredJson(
          "pendingSOSRequests",
          []
        );

      pendingSOS.push({
        ...payload,
        createdAt:
          new Date().toISOString(),
        offline: true,
      });

      setStoredJson(
        "pendingSOSRequests",
        pendingSOS
      );

      alert(
        "SOS could not reach the server. Your emergency request has been saved locally."
      );
    } finally {
      setSosLoading(false);
      setSosPressed(false);
    }
  };

  const startSOS = () => {
    setSosPressed(true);

    sosTimerRef.current = setTimeout(() => {
      submitSOS();
    }, 1500);
  };

  const cancelSOS = () => {
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }

    setSosPressed(false);
  };

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        clearTimeout(sosTimerRef.current);
      }
    };
  }, []);

  // ==========================================================
  // EMERGENCY CALL
  // ==========================================================

  const callNumber = (number) => {
    window.location.href = `tel:${number}`;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userData");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");

    navigate("/login");
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  // ==========================================================
  // WEATHER ICON
  // ==========================================================

  const WeatherIcon = () => {
    const condition =
      weather?.condition?.toLowerCase() || "";

    if (
      condition.includes("rain") ||
      condition.includes("shower") ||
      condition.includes("storm")
    ) {
      return <CloudRain size={54} />;
    }

    if (condition.includes("wind")) {
      return <Wind size={54} />;
    }

    return <CloudRain size={54} />;
  };

  // ==========================================================
  // ALERT ICON
  // ==========================================================

  const getAlertIcon = () => {
    const type =
      alert?.disasterType?.toLowerCase() ||
      "";

    if (
      type.includes("rain") ||
      type.includes("flood")
    ) {
      return <CloudRain size={34} />;
    }

    if (type.includes("fire")) {
      return <Flame size={34} />;
    }

    if (
      type.includes("heat") ||
      type.includes("temperature")
    ) {
      return <Thermometer size={34} />;
    }

    if (
      type.includes("storm") ||
      type.includes("cyclone")
    ) {
      return <Wind size={34} />;
    }

    return <AlertTriangle size={34} />;
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="dashboard-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            aria-label="Open menu"
          >
            <Menu size={23} />
          </button>

          <div
            className="brand"
            onClick={() => goTo("/dashboard")}
          >
            <div className="brand-icon">
              <ShieldAlert size={27} />
            </div>

            <span className="brand-name">
              Disaster Alert
            </span>
          </div>

          <div
            className={`connection-status ${
              online ? "online" : "offline"
            }`}
          >
            <span className="connection-dot" />

            {online
              ? "Online • Live GPS"
              : "Offline • Cached Data"}
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="desktop-navigation">
          <button
            className="nav-link active"
            onClick={() =>
              goTo("/dashboard")
            }
          >
            Home
          </button>

          <button
            className="nav-link"
            onClick={() =>
              goTo("/safety-info")
            }
          >
            Safety Info
          </button>

          <button
            className="nav-link"
            onClick={() =>
              goTo("/hazards")
            }
          >
            Hazards
          </button>

          <button
            className="nav-link"
            onClick={() =>
              goTo("/shelters")
            }
          >
            Shelters
          </button>

          <button
            className="nav-link"
            onClick={() =>
              goTo("/resources")
            }
          >
            Resources
          </button>

          <button
            className="settings-button"
            onClick={() =>
              goTo("/settings")
            }
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </nav>

        <div className="header-right">
          <button
            className={`sos-header-button ${
              sosPressed ? "pressed" : ""
            }`}
            onMouseDown={startSOS}
            onMouseUp={cancelSOS}
            onMouseLeave={cancelSOS}
            onTouchStart={startSOS}
            onTouchEnd={cancelSOS}
            disabled={sosLoading}
            title="Hold for 1.5 seconds to send SOS"
          >
            <Radio size={21} />

            <span>
              {sosLoading
                ? "Sending SOS..."
                : sosPressed
                ? "Release to Cancel"
                : "Hold for SOS"}
            </span>
          </button>

          <button
            className="profile-button"
            onClick={() =>
              goTo("/profile")
            }
            aria-label="Profile"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      {/* ======================================================
          MOBILE NAVIGATION
      ====================================================== */}

      {mobileMenuOpen && (
        <div className="mobile-navigation">
          <button
            onClick={() =>
              goTo("/dashboard")
            }
          >
            <Home size={19} />
            Home
          </button>

          <button
            onClick={() =>
              goTo("/safety-info")
            }
          >
            <Shield size={19} />
            Safety Info
          </button>

          <button
            onClick={() =>
              goTo("/hazards")
            }
          >
            <AlertTriangle size={19} />
            Hazards
          </button>

          <button
            onClick={() =>
              goTo("/shelters")
            }
          >
            <Home size={19} />
            Shelters
          </button>

          <button
            onClick={() =>
              goTo("/resources")
            }
          >
            <Info size={19} />
            Resources
          </button>

          <button
            onClick={() =>
              goTo("/settings")
            }
          >
            <Settings size={19} />
            Settings
          </button>

          <button
            onClick={handleLogout}
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      )}

      <main className="dashboard-content">
        {/* ====================================================
            ERROR / OFFLINE MESSAGE
        ==================================================== */}

        {!online && (
          <div className="offline-banner">
            <CircleAlert size={18} />

            <span>
              You are offline. Showing your
              latest available emergency data.
            </span>

            <button
              onClick={refreshDashboard}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="dashboard-error">
            <CircleAlert size={18} />

            <span>{errorMessage}</span>

            <button
              onClick={() =>
                setErrorMessage("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ====================================================
            DISASTER ALERT
        ==================================================== */}

        {alert &&
          alert.active &&
          showAlert && (
            <section className="disaster-alert-banner">
              <div className="alert-icon">
                {getAlertIcon()}
              </div>

              <div className="alert-content">
                <div className="alert-title">
                  <strong>
                    {alert.title}
                  </strong>

                  <span>•</span>

                  <span>
                    {alert.location}
                  </span>

                  <span>•</span>

                  <span>
                    Severity:{" "}
                    {alert.severity}
                  </span>

                  <span>
                    - Seek shelter immediately
                  </span>
                </div>

                <p>
                  {alert.message}
                </p>
              </div>

              <button
                className="close-alert"
                onClick={() =>
                  setShowAlert(false)
                }
                aria-label="Close alert"
              >
                <X size={21} />
              </button>
            </section>
          )}

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <section className="dashboard-main-grid">
          {/* ==================================================
              MAP
          ================================================== */}

          <div className="map-section-card">
            <div className="map-toolbar">
              <div className="map-switcher">
                <button
                  className={
                    mapMode === "map"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setMapMode("map")
                  }
                >
                  Map
                </button>

                <button
                  className={
                    mapMode === "satellite"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setMapMode(
                      "satellite"
                    )
                  }
                >
                  Satellite
                </button>
              </div>

              <div className="risk-control">
                <label>
                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span>
                    Live Flood Risk
                  </span>
                </label>

                <div className="risk-row">
                  <span className="risk-color high" />
                  High Risk
                </div>

                <div className="risk-row">
                  <span className="risk-color medium" />
                  Moderate Risk
                </div>

                <div className="risk-row">
                  <span className="risk-color low" />
                  Low Risk
                </div>
              </div>
            </div>

            <div className="map-container">
              <DisasterMap
                userLocation={location}
                currentLocation={location}
                safeLocations={
                  sheltersWithDistance
                }
                shelters={
                  sheltersWithDistance
                }
                selectedShelter={
                  selectedShelter
                }
                onShelterSelect={
                  setSelectedShelter
                }
                weather={weather}
                alert={alert}
                mapMode={mapMode}
                online={online}
                maxDistanceKm={
                  MAX_DISTANCE_KM
                }
              />

              {/* Map legend */}
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-dot location" />
                  <span>
                    Your Location
                  </span>
                </div>

                <div className="legend-item">
                  <span className="legend-shelter">
                    <Home size={11} />
                  </span>
                  <span>
                    Safe Shelter
                  </span>
                </div>

                <div className="legend-item">
                  <span className="legend-risk" />
                  <span>
                    Flood Risk Zone
                  </span>
                </div>

                <div className="legend-item">
                  <span className="legend-road" />
                  <span>
                    Major Road
                  </span>
                </div>

                <div className="map-scale">
                  <span />
                  <small>
                    2 km
                  </small>
                </div>
              </div>

              {/* Map controls */}
              <div className="map-controls">
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(
                        "disaster-map-zoom-in"
                      )
                    );
                  }}
                  aria-label="Zoom in"
                >
                  +
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(
                        "disaster-map-zoom-out"
                      )
                    );
                  }}
                  aria-label="Zoom out"
                >
                  −
                </button>

                <button
                  onClick={() =>
                    getUserLocation()
                  }
                  aria-label="Locate me"
                  disabled={
                    locationLoading
                  }
                >
                  <LocateFixed
                    size={19}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================
              SAFE HAVENS
          ================================================== */}

          <aside className="safe-havens-card">
            <div className="section-heading">
              <div className="heading-title">
                <div className="heading-icon green">
                  <Home size={20} />
                </div>

                <h2>
                  Nearest Safe Havens
                </h2>
              </div>

              <button
                className="view-all-button"
                onClick={() =>
                  goTo("/shelters")
                }
              >
                View All
              </button>
            </div>

            <div className="safe-havens-list">
              {loadingShelters &&
              nearbyShelters.length ===
                0 ? (
                <div className="loading-state">
                  <RefreshCw
                    size={22}
                    className="spin"
                  />
                  <span>
                    Finding nearby safe
                    locations...
                  </span>
                </div>
              ) : nearbyShelters.length >
                0 ? (
                nearbyShelters.map(
                  (shelter) => (
                    <article
                      className={`shelter-card ${
                        selectedShelter?.id ===
                        shelter.id
                          ? "selected"
                          : ""
                      }`}
                      key={shelter.id}
                    >
                      <div className="shelter-image">
                        {shelter.image ? (
                          <img
                            src={
                              shelter.image
                            }
                            alt={
                              shelter.name
                            }
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="shelter-placeholder">
                            <Home
                              size={28}
                            />
                          </div>
                        )}
                      </div>

                      <div className="shelter-information">
                        <h3>
                          {shelter.name}
                        </h3>

                        <div className="shelter-distance">
                          <MapPin
                            size={14}
                          />

                          <span>
                            {formatDistance(
                              shelter.calculatedDistanceKm
                            )}
                          </span>
                        </div>

                        <p className="shelter-address">
                          {shelter.address}
                        </p>

                        <div className="shelter-bottom">
                          <div className="shelter-tags">
                            <span className="beds-tag">
                              {shelter.beds ||
                                0}{" "}
                              beds available
                            </span>

                            <span className="elevation-tag">
                              <Waves
                                size={13}
                              />

                              {formatElevation(
                                shelter.elevation
                              )}
                            </span>
                          </div>

                          <button
                            className="direction-button"
                            onClick={() => {
                              setSelectedShelter(
                                shelter
                              );

                              openDirections(
                                shelter
                              );
                            }}
                          >
                            <Navigation
                              size={15}
                            />

                            Get Directions
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                )
              ) : (
                <div className="empty-state">
                  <Home size={30} />

                  <strong>
                    No safe havens found
                  </strong>

                  <span>
                    No safe location was
                    found within{" "}
                    {MAX_DISTANCE_KM} km.
                  </span>

                  <button
                    onClick={() =>
                      goTo("/shelters")
                    }
                  >
                    View all shelters
                  </button>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* ====================================================
            BOTTOM GRID
        ==================================================== */}

        <section className="dashboard-bottom-grid">
          {/* ==================================================
              QUICK DIAL
          ================================================== */}

          <div className="quick-dial-section">
            <div className="bottom-section-heading">
              <div>
                <Phone size={20} />
                <h2>
                  Emergency Quick Dial
                </h2>
              </div>
            </div>

            <div className="quick-dial-grid">
              {/* 112 */}
              <button
                className="emergency-card red"
                onClick={() =>
                  callNumber(
                    EMERGENCY_NUMBERS.emergency
                  )
                }
              >
                <div className="emergency-icon">
                  <Phone size={28} />
                </div>

                <div className="emergency-text">
                  <span>
                    Emergency
                  </span>

                  <strong>112</strong>

                  <small>
                    All Emergencies
                  </small>
                </div>
              </button>

              {/* 101 */}
              <button
                className="emergency-card orange"
                onClick={() =>
                  callNumber(
                    EMERGENCY_NUMBERS.fire
                  )
                }
              >
                <div className="emergency-icon">
                  <Flame size={29} />
                </div>

                <div className="emergency-text">
                  <span>
                    Fire Services
                  </span>

                  <strong>101</strong>

                  <small>
                    Fire & Rescue
                  </small>
                </div>
              </button>

              {/* 108 */}
              <button
                className="emergency-card white"
                onClick={() =>
                  callNumber(
                    EMERGENCY_NUMBERS.ambulance
                  )
                }
              >
                <div className="emergency-icon ambulance">
                  <Ambulance
                    size={28}
                  />
                </div>

                <div className="emergency-text">
                  <span>
                    Ambulance
                  </span>

                  <strong>108</strong>

                  <small>
                    Medical Emergency
                  </small>
                </div>
              </button>

              {/* 100 */}
              <button
                className="emergency-card white"
                onClick={() =>
                  callNumber(
                    EMERGENCY_NUMBERS.police
                  )
                }
              >
                <div className="emergency-icon police">
                  <Shield size={28} />
                </div>

                <div className="emergency-text">
                  <span>
                    Police
                  </span>

                  <strong>100</strong>

                  <small>
                    Law & Order
                  </small>
                </div>
              </button>
            </div>
          </div>

          {/* ==================================================
              WEATHER
          ================================================== */}

          <aside className="weather-card">
            <div className="weather-heading">
              <div>
                <CloudRain size={20} />

                <h2>
                  {weather?.city ||
                    "Tirupati"}{" "}
                  Weather
                </h2>
              </div>

              <span>
                {weather?.updatedAt
                  ? `Updated ${weather.updatedAt}`
                  : "Live data"}
              </span>
            </div>

            {loadingWeather &&
            !weather ? (
              <div className="weather-loading">
                <RefreshCw
                  size={24}
                  className="spin"
                />

                <span>
                  Loading weather...
                </span>
              </div>
            ) : (
              <div className="weather-content">
                <div className="weather-main">
                  <div className="weather-icon">
                    <WeatherIcon />
                  </div>

                  <div className="weather-temperature">
                    <strong>
                      {Math.round(
                        numberValue(
                          weather?.temperature,
                          30
                        )
                      )}
                      °C
                    </strong>

                    <span>
                      {weather?.condition ||
                        "Weather unavailable"}
                    </span>

                    {weather?.condition
                      ?.toLowerCase()
                      .includes(
                        "rain"
                      ) && (
                      <small>
                        High chance of
                        flooding in
                        low-lying areas
                      </small>
                    )}
                  </div>
                </div>

                <div className="weather-details">
                  <div className="weather-detail">
                    <Droplets
                      size={20}
                    />

                    <span>
                      Humidity
                    </span>

                    <strong>
                      {numberValue(
                        weather?.humidity,
                        0
                      )}
                      %
                    </strong>
                  </div>

                  <div className="weather-detail">
                    <Wind size={20} />

                    <span>
                      Wind
                    </span>

                    <strong>
                      {numberValue(
                        weather?.windSpeed,
                        0
                      )}{" "}
                      km/h
                    </strong>
                  </div>

                  <div className="weather-detail">
                    <Gauge
                      size={20}
                    />

                    <span>
                      Visibility
                    </span>

                    <strong>
                      {numberValue(
                        weather?.visibility,
                        0
                      )}{" "}
                      km
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>

        {/* ====================================================
            STATUS FOOTER
        ==================================================== */}

        <section className="dashboard-status-row">
          <div className="status-item">
            <CheckCircle2 size={17} />

            <span>
              Emergency services available
            </span>
          </div>

          <div className="status-item">
            <Navigation size={17} />

            <span>
              GPS accuracy{" "}
              {location?.accuracy
                ? `±${Math.round(
                    location.accuracy
                  )} m`
                : "checking..."}
            </span>
          </div>

          <div className="status-item">
            <Shield size={17} />

            <span>
              Safe radius:{" "}
              {MAX_DISTANCE_KM} km
            </span>
          </div>

          <button
            className="refresh-dashboard-button"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh data"}
          </button>
        </section>
      </main>
    </div>
  );
}

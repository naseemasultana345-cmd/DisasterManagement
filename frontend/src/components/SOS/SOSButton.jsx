import {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

import "./SOSButton.css";

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

const OFFLINE_SOS_KEY =
  "pendingSOSRequests";

const LAST_LOCATION_KEY =
  "lastKnownLocation";

function SOSButton() {

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sosSent,
    setSosSent,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    holdProgress,
    setHoldProgress,
  ] = useState(0);

  const holdTimerRef =
    useRef(null);

  const holdStartRef =
    useRef(null);


  // ================================================
  // HOLD TO ACTIVATE SOS
  // ================================================

  const startSOSHold = () => {

    if (sending) {
      return;
    }

    if (holdTimerRef.current) {
      clearInterval(
        holdTimerRef.current
      );
    }

    holdStartRef.current =
      Date.now();

    setHoldProgress(0);

    holdTimerRef.current =
      setInterval(() => {

        const elapsed =
          Date.now() -
          holdStartRef.current;

        const progress =
          Math.min(
            (elapsed / 3000) * 100,
            100
          );

        setHoldProgress(
          progress
        );

        if (progress >= 100) {

          clearInterval(
            holdTimerRef.current
          );

          holdTimerRef.current =
            null;

          holdStartRef.current =
            null;

          setHoldProgress(0);

          setShowConfirm(true);

        }

      }, 50);

  };


  const cancelSOSHold = () => {

    if (holdTimerRef.current) {

      clearInterval(
        holdTimerRef.current
      );

      holdTimerRef.current =
        null;

    }

    holdStartRef.current =
      null;

    setHoldProgress(0);

  };


  useEffect(() => {

    return () => {

      if (holdTimerRef.current) {

        clearInterval(
          holdTimerRef.current
        );

      }

    };

  }, []);


  // ================================================
  // GET SAVED OFFLINE SOS
  // ================================================

  const getPendingSOS = () => {

    try {

      const saved =
        localStorage.getItem(
          OFFLINE_SOS_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      return [];

    }
  };


  // ================================================
  // SAVE OFFLINE SOS
  // ================================================

  const saveOfflineSOS = (
    sos
  ) => {

    const existing =
      getPendingSOS();

    existing.push(sos);

    localStorage.setItem(
      OFFLINE_SOS_KEY,
      JSON.stringify(existing)
    );

  };


  // ================================================
  // GET LAST KNOWN LOCATION
  // ================================================

  const getLastKnownLocation = () => {

    try {

      const savedLocation =
        localStorage.getItem(
          LAST_LOCATION_KEY
        );

      if (!savedLocation) {
        return null;
      }

      const parsedLocation =
        JSON.parse(savedLocation);

      if (
        parsedLocation &&
        typeof parsedLocation.latitude === "number" &&
        typeof parsedLocation.longitude === "number"
      ) {

        return {

          latitude:
            parsedLocation.latitude,

          longitude:
            parsedLocation.longitude,

        };

      }

      return null;

    } catch (error) {

      console.error(
        "Last known location error:",
        error
      );

      return null;

    }
  };


  // ================================================
  // SAVE LAST KNOWN LOCATION
  // ================================================

  const saveLastKnownLocation = (
    location
  ) => {

    localStorage.setItem(
      LAST_LOCATION_KEY,
      JSON.stringify({

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        savedAt:
          new Date().toISOString(),

      })
    );

  };


  // ================================================
  // GET LOGGED-IN USER ID
  // ================================================

  const getLoggedInUserId = () => {

    const possibleKeys = [
      "userId",
      "loggedInUserId",
      "currentUserId",
    ];

    for (
      const key of possibleKeys
    ) {

      const value =
        localStorage.getItem(key);

      if (value) {

        const userId =
          Number(value);

        if (
          !Number.isNaN(userId)
        ) {

          return userId;

        }

      }

    }

    return null;

  };


  // ================================================
  // SEND SOS TO BACKEND
  // ================================================

  const sendSOS = async (
    sos
  ) => {

    try {

      const response =
        await axios.post(
          `${API_BASE_URL}/sos`,
          sos,
          {
            timeout: 5000,
          }
        );

      return {

        success: true,

        data:
          response.data,

      };

    } catch (error) {

      console.error(
        "SOS sending error:",
        error
      );

      return {

        success: false,

        data: null,

      };

    }
  };


  // ================================================
  // FORMAT ASSIGNED SERVICE MESSAGE
  // ================================================

  const getAssignedServiceMessage = (
    data
  ) => {

    if (!data) {

      return (
        "SOS alert sent successfully. " +
        "Emergency services have been notified."
      );

    }

    if (!data.assignedServiceName) {

      return (
        "SOS alert was sent successfully, " +
        "but no nearby emergency service " +
        "was found in the system."
      );

    }

    const serviceName =
      data.assignedServiceName;

    const serviceType =
      data.assignedServiceType
        ? data.assignedServiceType
        : "EMERGENCY SERVICE";

    const distance =
      typeof data.distanceKm === "number"
        ? `${data.distanceKm} km`
        : "distance unavailable";

    return (
      `SOS sent successfully. ` +
      `${serviceType}: ${serviceName} ` +
      `has been assigned. ` +
      `Distance: ${distance}.`
    );

  };


  // ================================================
  // SEND PENDING SOS
  // ================================================

  const sendPendingSOS =
    async () => {

      if (!navigator.onLine) {
        return;
      }

      const pending =
        getPendingSOS();

      if (
        pending.length === 0
      ) {
        return;
      }

      const remaining = [];

      for (
        const sos of pending
      ) {

        const result =
          await sendSOS(sos);

        if (result.success) {

          console.log(
            "Pending SOS sent successfully:",
            result.data
          );

        } else {

          remaining.push(sos);

        }

      }

      if (
        remaining.length === 0
      ) {

        localStorage.removeItem(
          OFFLINE_SOS_KEY
        );

      } else {

        localStorage.setItem(
          OFFLINE_SOS_KEY,
          JSON.stringify(
            remaining
          )
        );

      }

    };


  // ================================================
  // INTERNET RETURNS
  // ================================================

  useEffect(() => {

    const handleOnline =
      async () => {

        await sendPendingSOS();

      };

    window.addEventListener(
      "online",
      handleOnline
    );

    // ------------------------------------------------
    // Also check when component loads
    // ------------------------------------------------

    if (navigator.onLine) {

      sendPendingSOS();

    }

    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

    };

  }, []);


  // ================================================
  // GET LOCATION
  // ================================================

  const getCurrentLocation =
    () => {

      return new Promise(
        (
          resolve,
          reject
        ) => {

          if (
            !navigator.geolocation
          ) {

            reject(
              new Error(
                "Geolocation is not supported."
              )
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

              // ------------------------------------
              // Save latest successful location
              // ------------------------------------

              saveLastKnownLocation(
                location
              );

              resolve(
                location
              );

            },

            (error) => {

              reject(error);

            },

            {

              enableHighAccuracy:
                true,

              timeout:
                10000,

              maximumAge:
                0,

            }

          );

        }
      );

    };


  // ================================================
  // CREATE SOS OBJECT
  // ================================================

  const createSOSObject = (
    location
  ) => {

    // ----------------------------------------------
    // Get logged-in user's ID
    // ----------------------------------------------

    const userId =
      getLoggedInUserId();

    return {

      userId:
        userId,

      latitude:
        location.latitude,

      longitude:
        location.longitude,

      // ----------------------------------------------
      // SOS emergency type
      // ----------------------------------------------

      emergencyType:
        "SOS EMERGENCY",

      status:
        "ACTIVE",

      createdAt:
        new Date().toISOString(),

    };

  };


  // ================================================
  // SEND SOS
  // ================================================

  const handleSOS =
    async () => {

      setShowConfirm(false);

      setSending(true);

      setMessage("");

      setSosSent(false);

      try {

        let location = null;


        // =================================================
        // ONLINE
        // =================================================

        if (navigator.onLine) {

          try {

            // ---------------------------------------------
            // Try to get the user's current GPS location
            // ---------------------------------------------

            location =
              await getCurrentLocation();

          } catch (locationError) {

            console.error(
              "Current location error:",
              locationError
            );

            // ---------------------------------------------
            // If current GPS fails, use last known location
            // ---------------------------------------------

            location =
              getLastKnownLocation();

          }


          // -----------------------------------------------
          // If no location is available at all
          // -----------------------------------------------

          if (!location) {

            setSosSent(false);

            setMessage(
              "Unable to get your location. " +
              "Please enable location access or " +
              "allow the application to use your location."
            );

            return;

          }


          // -----------------------------------------------
          // Create SOS object
          // -----------------------------------------------

          const sos =
            createSOSObject(
              location
            );


          // -----------------------------------------------
          // Send to backend
          // -----------------------------------------------

          const result =
            await sendSOS(sos);


          // -----------------------------------------------
          // Successfully sent
          // -----------------------------------------------

          if (result.success) {

            setSosSent(true);

            setMessage(
              getAssignedServiceMessage(
                result.data
              )
            );

          }


          // -----------------------------------------------
          // Internet failed during request
          // -----------------------------------------------

          else {

            saveOfflineSOS(
              sos
            );

            setSosSent(true);

            setMessage(
              "Internet connection failed. " +
              "Your SOS has been saved with your location " +
              "and will be sent automatically when the " +
              "connection returns."
            );

          }

        }


        // =================================================
        // OFFLINE
        // =================================================

        else {

          // -----------------------------------------------
          // Use last known location when offline
          // -----------------------------------------------

          location =
            getLastKnownLocation();


          // -----------------------------------------------
          // No previously saved location
          // -----------------------------------------------

          if (!location) {

            setSosSent(false);

            setMessage(
              "You are offline and no last known location " +
              "is available. Please open the application " +
              "while location access is enabled at least once."
            );

            return;

          }


          // -----------------------------------------------
          // Create SOS using LAST KNOWN LOCATION
          // -----------------------------------------------

          const sos =
            createSOSObject(
              location
            );


          // -----------------------------------------------
          // Save SOS locally
          // -----------------------------------------------

          saveOfflineSOS(
            sos
          );

          setSosSent(true);

          setMessage(
            "You are offline. Your SOS has been saved " +
            "using your last known location. It will be " +
            "sent automatically when internet connection " +
            "returns and the nearest emergency service " +
            "will be assigned."
          );

        }

      } catch (error) {

        console.error(
          "SOS error:",
          error
        );

        setSosSent(false);

        setMessage(
          "Unable to send SOS. Please try again."
        );

      } finally {

        setSending(false);

      }

    };


  // ================================================
  // RESET
  // ================================================

  const closeMessage =
    () => {

      setSosSent(false);

      setMessage("");

    };


  // ================================================
  // RENDER
  // ================================================

  return (

    <section className="sos-section">

      <div className="sos-header">

        <div>

          <span className="sos-label">
            EMERGENCY ASSISTANCE
          </span>

          <h2>
            🚨 Need Immediate Help?
          </h2>

          <p>
            Press the SOS button to
            send your current location
            to the emergency system.
          </p>

        </div>

      </div>


      {/* ============================================
          SOS BUTTON
      ============================================ */}

      <button
        type="button"
        className={`sos-button ${
          sending
            ? "sending"
            : ""
        }`}
        onPointerDown={startSOSHold}
        onPointerUp={cancelSOSHold}
        onPointerCancel={cancelSOSHold}
        onPointerLeave={cancelSOSHold}
        disabled={sending}
      >

        <span
          className="sos-hold-progress"
          style={{
            width: `${holdProgress}%`,
          }}
        />

        <span className="sos-button-content">

          <span className="sos-button-icon">
            🚨
          </span>

          <span>

            {sending
              ? "SENDING SOS..."
              : holdProgress > 0
                ? "KEEP HOLDING..."
                : "HOLD 3 SEC"}

          </span>

        </span>

      </button>


      {/* ============================================
          CONFIRMATION MODAL
      ============================================ */}

      {showConfirm && (

        <div className="sos-modal-overlay">

          <div className="sos-modal">

            <div className="sos-modal-icon">
              🚨
            </div>

            <h3>
              Send Emergency SOS?
            </h3>

            <p>
              Your current GPS location
              will be sent to the disaster
              management system.
            </p>

            <div className="sos-modal-actions">

              <button
                type="button"
                className="sos-cancel"
                onClick={() =>
                  setShowConfirm(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="sos-confirm"
                onClick={handleSOS}
              >
                🚨 Send SOS
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ============================================
          SOS MESSAGE
      ============================================ */}

      {message && (

        <div
          className={`sos-message ${
            sosSent
              ? "success"
              : "error"
          }`}
        >

          <div className="sos-message-icon">

            {sosSent
              ? "✅"
              : "⚠️"}

          </div>

          <div>

            <strong>

              {sosSent
                ? "SOS Alert"
                : "SOS Error"}

            </strong>

            <p>
              {message}
            </p>

          </div>

          <button
            type="button"
            onClick={closeMessage}
          >
            ✕
          </button>

        </div>

      )}

    </section>

  );

}

export default SOSButton;
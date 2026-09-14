import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [userLocation, setUserLocation] = useState(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Location error:", error);
        alert("Unable to get your location.");
      }
    );
  };

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-icon">🚨</div>

          <div>
            <h1>Disaster Alert</h1>
            <span>Emergency Safety Dashboard</span>
          </div>
        </div>

        <div className="connection-status online">
          <span className="status-dot"></span>
          Online
        </div>
      </header>

      <main className="dashboard-content">

        <section className="welcome-section">
          <div>
            <div className="welcome-label">
              SAFETY CENTER
            </div>

            <h2>Stay Alert. Stay Safe.</h2>

            <p>
              Your disaster safety information will appear here.
            </p>
          </div>
        </section>

        <section className="dashboard-section">

          <h2>Your Location</h2>

          {userLocation ? (
            <div>
              <p>
                Latitude: {userLocation.latitude.toFixed(6)}
              </p>

              <p>
                Longitude: {userLocation.longitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <p>Location not available.</p>
          )}

          <button onClick={getLocation}>
            📍 Get My Location
          </button>

        </section>

        <section className="dashboard-section">

          <h2>🚨 Disaster Alert</h2>

          <p>No active disaster alert.</p>

        </section>

        <section className="dashboard-section">

          <h2>🛡️ Safe Locations</h2>

          <p>Safe locations will appear here.</p>

        </section>

      </main>

      <footer className="dashboard-footer">

        <div className="footer-brand">
          🛡️ Disaster Alert System
        </div>

        <p>
          Stay Alert • Stay Safe • Stay Prepared
        </p>

      </footer>

    </div>
  );
}

export default Dashboard;
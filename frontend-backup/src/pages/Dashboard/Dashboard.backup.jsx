
import React from "react";
import "./Dashboard.css";

function Dashboard() {
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

            <h2>
              Stay Alert. Stay Safe.
            </h2>

            <p>
              Welcome to the Disaster Alert Emergency
              Safety Dashboard.
            </p>
          </div>

        </section>


        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">🌧️</div>

            <h3>Disaster Alert</h3>

            <p>
              No active disaster alert at the moment.
            </p>
          </div>


          <div className="dashboard-card">
            <div className="card-icon">🌤️</div>

            <h3>Weather</h3>

            <p>
              Weather information will appear here.
            </p>
          </div>


          <div className="dashboard-card">
            <div className="card-icon">📍</div>

            <h3>Your Location</h3>

            <p>
              Location information will appear here.
            </p>
          </div>


          <div className="dashboard-card">
            <div className="card-icon">🏥</div>

            <h3>Safe Locations</h3>

            <p>
              Nearby safe locations will appear here.
            </p>
          </div>

        </section>


        <section className="emergency-section">

          <h2>Emergency Services</h2>

          <div className="resource-grid">

            <div className="resource-card">
              <div className="resource-icon">
                🚑
              </div>

              <div>
                <h3>Ambulance</h3>

                <p>
                  Medical emergency service
                </p>

                <a href="tel:108">
                  Call 108
                </a>
              </div>
            </div>


            <div className="resource-card">
              <div className="resource-icon">
                🚒
              </div>

              <div>
                <h3>Fire & Rescue</h3>

                <p>
                  Fire and rescue emergency
                </p>

                <a href="tel:101">
                  Call 101
                </a>
              </div>
            </div>


            <div className="resource-card">
              <div className="resource-icon">
                📞
              </div>

              <div>
                <h3>Emergency</h3>

                <p>
                  National emergency service
                </p>

                <a href="tel:112">
                  Call 112
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

      </footer>

    </div>
  );
}

export default Dashboard;

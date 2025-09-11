'use client';

import React from "react";

// Navigation Component
const Navbar = () => {
  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <nav className="relative z-20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center justify-center w-12 h-12 glass rounded-xl energy-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
                stroke="currentColor"
                className="text-cyan-300"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Green Energy Monitor</h1>
            <p className="text-xs text-teal-100/70">Sensor Data Monitoring</p>
          </div>
        </div>
        <button
          onClick={goToDashboard}
          className="btn-primary px-6 py-2 rounded-lg font-medium"
        >
          View Dashboard
        </button>
      </div>
    </nav>
  );
};

// Hero Component
const Hero = () => {
  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative z-10 px-6 py-16 text-center">
      <div className="max-w-4xl mx-auto fade-in">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
          Real-time Green Energy Monitoring
        </h2>
        <p className="text-xl md:text-2xl text-teal-100/80 mb-8 max-w-2xl mx-auto">
          Track consumption, voltage, current, turbine speed, and temperature with live sensor data
          monitoring.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goToDashboard}
            className="btn-primary px-8 py-4 rounded-xl font-semibold text-lg"
          >
            Launch Dashboard
          </button>
          <button
            onClick={scrollToFeatures}
            className="glass px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ iconBg, icon, title, description }) => {
  return (
    <div className="glass rounded-xl p-8 feature-card hover:translate-y-[-5px] transition-all">
      <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h4 className="text-xl font-semibold mb-3">{title}</h4>
      <p className="text-teal-100/70">{description}</p>
    </div>
  );
};

// Features Section
const Features = () => {
  return (
    <section id="features" className="relative z-10 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Sensor Monitoring</h3>
          <p className="text-teal-100/70 text-lg max-w-2xl mx-auto">
            Real-time monitoring of consumption, voltage, current, turbine speed, and temperature sensors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            iconBg="bg-cyan-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" className="text-cyan-400" strokeWidth="2" />
                <path d="M7 12l3-3 4 4 5-5" stroke="currentColor" className="text-cyan-400" strokeWidth="2" />
              </svg>
            }
            title="Real-time Sensor Data"
            description="Monitor temperature, turbine speed (RPM), voltage, current, and consumption with live data updates."
          />
          <FeatureCard
            iconBg="bg-emerald-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" className="text-emerald-400" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" className="text-emerald-400" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" className="text-emerald-400" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" className="text-emerald-400" strokeWidth="2" />
              </svg>
            }
            title="Historical Trends"
            description="View 24-hour historical data with interactive charts to analyze performance patterns."
          />
          <FeatureCard
            iconBg="bg-yellow-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" className="text-yellow-400" strokeWidth="2" />
              </svg>
            }
            title="Current Monitoring"
            description="Track electrical current flow with real-time monitoring and load status indicators."
          />
          <FeatureCard
            iconBg="bg-red-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke="currentColor" className="text-red-400" strokeWidth="2" />
              </svg>
            }
            title="Local Standards"
            description="Configured for Philippine electrical standards with 220V monitoring and local compliance."
          />
          <FeatureCard
            iconBg="bg-purple-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 3v10h4l-5 5v-10H7l5-5z" stroke="currentColor" className="text-purple-400" strokeWidth="2" />
              </svg>
            }
            title="Current Analysis"
            description="Monitor electrical current patterns with detailed analysis and load status indicators."
          />
          <FeatureCard
            iconBg="bg-green-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" className="text-green-400" strokeWidth="2" />
                <path d="M2 17l10 5 10-5" stroke="currentColor" className="text-green-400" strokeWidth="2" />
                <path d="M2 12l10 5 10-5" stroke="currentColor" className="text-green-400" strokeWidth="2" />
              </svg>
            }
            title="Consumption Tracking"
            description="Track energy consumption patterns and monitor turbine operational efficiency over time."
          />
          <FeatureCard
            iconBg="bg-blue-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" className="text-blue-400" strokeWidth="2" />
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" className="text-blue-400" strokeWidth="2" />
              </svg>
            }
            title="Turbine Performance"
            description="Monitor RPM and efficiency of your green energy turbine in real-time."
          />
          <FeatureCard
            iconBg="bg-orange-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" className="text-orange-400" strokeWidth="2" />
              </svg>
            }
            title="Temperature Monitoring"
            description="Track system temperature to prevent overheating and ensure optimal performance."
          />
          <FeatureCard
            iconBg="bg-indigo-500/20"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="currentColor" className="text-indigo-400" strokeWidth="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" className="text-indigo-400" strokeWidth="2" />
              </svg>
            }
            title="Mobile Ready"
            description="Fully responsive design that works perfectly on desktop, tablet, and mobile devices."
          />
        </div>
      </div>
    </section>
  );
};

// Main App
const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-cyan-400/5 float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-emerald-400/5 float" style={{ animationDelay: "-2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-teal-400/5 float" style={{ animationDelay: "-4s" }}></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-cyan-300/5 float" style={{ animationDelay: "-1s" }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-28 h-28 rounded-full bg-purple-400/5 float" style={{ animationDelay: "-3s" }}></div>
      </div>

      <Navbar />
      <Hero />
      <Features />
    </div>
  );
};

export default App;
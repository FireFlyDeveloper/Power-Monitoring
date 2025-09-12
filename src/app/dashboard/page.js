'use client';

import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { useAuth } from "../../utils/auth";
import markdownit from 'markdown-it'
import pdfMake from "pdfmake/build/pdfmake";
import "pdfmake/build/vfs_fonts";
import htmlToPdfmake from 'html-to-pdfmake';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const md = markdownit()

const Dashboard = () => {
  const ws = useRef(null);
  const { signOut } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const profileRef = useRef(null);
  const changePasswordRef = useRef(null);

  // Add state for selected date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingJson, setIsDownloadingJson] = useState(false);

  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [changePasswordErrors, setChangePasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState("");

  const [metrics, setMetrics] = useState({
    temperature: 0,
    rpm: 0,
    voltage: 0,
    kwh: 0,
    current: 0, // Added current metric
  });

  const [chartData, setChartData] = useState({
    labels: [],
    temperature: [],
    rpm: [],
    voltage: [],
    power: [],
    current: [], // Added current data array
  });

  const [todayKwh, setTodayKwh] = useState(0);

  // System status state
  const [systemStatus, setSystemStatus] = useState({
    turbineOperational: false,
    gridConnection: false,
    sensorsActive: false,
    lastUpdate: null,
    alerts: []
  });

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfilePopup(false);
      }

      if (changePasswordRef.current && !changePasswordRef.current.contains(event.target) &&
        !event.target.closest('.profile-option')) {
        setShowChangePassword(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimeout;

    const connectWebSocket = async () => {
      const token = await fetch("/api/auth/get", { method: 'POST' });
      const session = await token.json();

      ws.current = new WebSocket(
        `wss://power-monitoring-backend.onrender.com/ws/data?token=${encodeURIComponent(session.token)}`
      );

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        requestHistory(); // request initial history
        requestSystemStatus(); // request system status
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.data?.action === "update") {
          setMetrics((prev) => ({ ...prev, ...message.data.data }));
        }

        if (message.action === "lastData") {
          setMetrics({
            temperature: message.data.temperature,
            rpm: message.data.rpm,
            voltage: message.data.voltage,
            kwh: message.data.kwh,
            current: message.data.current || 0, // Handle current data
          });
        }

        if (message.action === "history") {
          const history = message.data;
          const labels = history.map((d) => new Date(d.created_at));
          const temperatureData = history
            .filter((d) => d.sensor_type === "temperature")
            .map((d) => ({ x: new Date(d.created_at), y: parseFloat(d.avg_value) }));
          const rpmData = history
            .filter((d) => d.sensor_type === "rpm")
            .map((d) => ({ x: new Date(d.created_at), y: parseFloat(d.avg_value) }));
          const voltageData = history
            .filter((d) => d.sensor_type === "voltage")
            .map((d) => ({ x: new Date(d.created_at), y: parseFloat(d.avg_value) }));
          const kwhData = history
            .filter((d) => d.sensor_type === "kwh")
            .map((d) => ({ x: new Date(d.created_at), y: parseFloat(d.avg_value) }));
          const currentData = history
            .filter((d) => d.sensor_type === "current")
            .map((d) => ({ x: new Date(d.created_at), y: parseFloat(d.avg_value) }));

          const totalKwh = kwhData.reduce((sum, dataPoint) => sum + dataPoint.y, 0);
          setTodayKwh(totalKwh);

          setChartData({
            labels,
            temperature: temperatureData,
            rpm: rpmData,
            voltage: voltageData,
            power: kwhData,
            current: currentData,
          });
        }

        // Handle system status updates
        if (message.action === "systemStatus") {
          setSystemStatus({
            turbineOperational: message.data.turbine_operational,
            gridConnection: message.data.grid_connection_stable,
            sensorsActive: message.data.all_sensors_active,
            lastUpdate: new Date(message.data.timestamp),
            alerts: message.data.alerts || []
          });
        }

        // Handle alerts
        if (message.action === "alert") {
          setSystemStatus(prev => ({
            ...prev,
            alerts: [...prev.alerts, {
              id: message.data.id,
              message: message.data.message,
              severity: message.data.severity,
              timestamp: new Date(message.data.timestamp)
            }]
          }));
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 5s...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000); // reconnect after 5s
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.current.close();
      };
    };

    connectWebSocket();

    return () => clearTimeout(reconnectTimeout);
  }, []);

  // Request history when selected date changes
  useEffect(() => {
    requestHistory();
  }, [selectedDate]);

  // Request system status every minute
  useEffect(() => {
    const interval = setInterval(requestSystemStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const requestHistory = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const start = new Date(selectedDate);
    start.setHours(8, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(7, 59, 59, 999);

    ws.current.send(
      JSON.stringify({
        action: "getHistory",
        start: start.toISOString(),
        end: end.toISOString(),
      })
    );
  };

  const requestSystemStatus = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({
        action: "getSystemStatus"
      })
    );
  };

  const acknowledgeAlert = (alertId) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({
        action: "acknowledgeAlert",
        alertId: alertId
      })
    );

    // Remove the acknowledged alert from local state
    setSystemStatus(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  const handleChangePasswordInput = (e) => {
    const { name, value } = e.target;
    setChangePasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when typing
    if (changePasswordErrors[name]) {
      setChangePasswordErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateChangePassword = () => {
    const errors = {};

    if (!changePasswordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!changePasswordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (changePasswordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!changePasswordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setChangePasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const downloadReport = async () => {
    setIsDownloading(true);
    try {
      const month = selectedDate.toLocaleString('default', { month: 'long' }).toLowerCase();
      const year = selectedDate.getFullYear();

      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: month,
          year: year
        }),
      });

      if (response.status === 404) {
        alert("No data to report");
      }

      if (response.ok) {
        const data = await response.json();
        const html = md.render(data.report);
        const pdfContent = htmlToPdfmake(html);

        const docDefinition = {
          content: pdfContent,
          defaultStyle: {
            fontSize: 11
          }
        };

        pdfMake.createPdf(docDefinition).download(`energy-report-${month}_${year}.pdf`);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadJsonData = async () => {
    setIsDownloadingJson(true);
    try {
      const month = selectedDate.toLocaleString('default', { month: 'long' }).toLowerCase();
      const year = selectedDate.getFullYear();

      const response = await fetch("/api/report/raw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: month,
          year: year
        }),
      });

      if (response.status === 404) {
        alert("No data to report");
      }

      if (response.ok) {
        const data = await response.json();
        const jsonString = JSON.stringify(data.data, null, 2);

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `energy-data-${month}_${year}.json`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('Failed to download data. Please try again.');
    } finally {
      setIsDownloadingJson(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!validateChangePassword()) return;

    setIsChangingPassword(true);
    setChangePasswordMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: changePasswordData.currentPassword,
          newPassword: changePasswordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setChangePasswordMessage("Password changed successfully");
        setChangePasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        // Close the popup after a delay
        setTimeout(() => {
          setShowChangePassword(false);
          setChangePasswordMessage("");
        }, 2000);
      } else {
        setChangePasswordMessage(data.message || "Failed to change password");
      }
    } catch (error) {
      setChangePasswordMessage("An error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatValue = (key, value) => {
    switch (key) {
      case "temperature":
        return value.toFixed(1) + "°C";
      case "rpm":
        return Math.round(value).toLocaleString();
      case "voltage":
        return value.toFixed(1) + "V";
      case "kwh":
        return value.toLocaleString() + " kWh";
      case "current":
        return value.toFixed(2) + "A"; // Format current with 2 decimal places and Ampere unit
      default:
        return value;
    }
  };

  const getKwhStatus = (value) => {
    if (value === 0) return "No Usage";
    if (value < 50) return "Low Usage";
    if (value < 200) return "Normal Usage";
    return "High Usage";
  };

  const getCurrentStatus = (value) => {
    if (value === 0) return "No Load";
    if (value < 5) return "Low Load";
    if (value < 15) return "Normal Load";
    if (value < 25) return "High Load";
    return "Overload";
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "white" } } },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'HH:mm',
          displayFormats: { hour: 'HH:mm' },
        },
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: { type: "linear", display: true, position: "left", ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
      y1: { type: "linear", display: true, position: "right", ticks: { color: "white" }, grid: { drawOnChartArea: false } },
    },
  };

  const tempRpmChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: chartData.temperature,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        yAxisID: "y",
      },
      {
        label: "RPM",
        data: chartData.rpm,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y1",
      },
    ],
  };

  const voltageCurrentChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Voltage (V)",
        data: chartData.voltage,
        borderColor: "rgb(234, 179, 8)",
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        yAxisID: "y",
      },
      {
        label: "Current (A)",
        data: chartData.current,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        yAxisID: "y1",
      },
    ],
  };

  const powerChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Power Usage (kWh)",
        data: chartData.power,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y",
        fill: true,
      },
    ],
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white p-6 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-cyan-400/5 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-emerald-400/5 animate-float" style={{ animationDelay: "-2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-teal-400/5 animate-float" style={{ animationDelay: "-4s" }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 glass rounded-xl animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke="currentColor" className="text-cyan-300" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Green Energy Monitor</h1>
              <p className="text-teal-100/70">Real-time sensor monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${systemStatus.gridConnection ? 'bg-green-400' : 'bg-red-400'} rounded-full animate-pulse`}></div>
              <span className="text-sm text-teal-100/80">
                {systemStatus.gridConnection ? 'System Online' : 'System Offline'}
              </span>
            </div>

            <button
              onClick={downloadJsonData}
              disabled={isDownloadingJson}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDownloadingJson ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Preparing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Download JSON</span>
                </>
              )}
            </button>

            {/* Download Report Button */}
            <button
              onClick={downloadReport}
              disabled={isDownloading}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Download Report</span>
                </>
              )}
            </button>

            {/* Profile Icon */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfilePopup(!showProfilePopup)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Profile Popup */}
              {showProfilePopup && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-teal-500/20">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-teal-100/60">System Administrator</p>
                  </div>

                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-teal-700/30 transition-colors profile-option"
                    onClick={() => {
                      setShowChangePassword(true);
                      setShowProfilePopup(false);
                    }}
                  >
                    Change Password
                  </button>

                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-teal-700/30 transition-colors"
                    onClick={() => {
                      signOut();
                      setShowProfilePopup(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Popup */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              ref={changePasswordRef}
              className="glass rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="text-teal-100/70 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={changePasswordData.currentPassword}
                    onChange={handleChangePasswordInput}
                    className="w-full bg-slate-800/50 border border-teal-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter current password"
                  />
                  {changePasswordErrors.currentPassword && (
                    <p className="text-red-400 text-xs mt-1">{changePasswordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={changePasswordData.newPassword}
                    onChange={handleChangePasswordInput}
                    className="w-full bg-slate-800/50 border border-teal-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter new password"
                  />
                  {changePasswordErrors.newPassword && (
                    <p className="text-red-400 text-xs mt-1">{changePasswordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={changePasswordData.confirmPassword}
                    onChange={handleChangePasswordInput}
                    className="w-full bg-slate-800/50 border border-teal-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Confirm new password"
                  />
                  {changePasswordErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{changePasswordErrors.confirmPassword}</p>
                  )}
                </div>

                {changePasswordMessage && (
                  <p className={`text-sm ${changePasswordMessage.includes("successfully") ? "text-green-400" : "text-red-400"}`}>
                    {changePasswordMessage}
                  </p>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2 text-sm rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Temperature"
            value={formatValue("temperature", metrics.temperature)}
            iconColor="red"
            range="-10°C to 50°C"
            status={metrics.temperature > 45 ? "Warning" : "Normal"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <MetricCard
            title="RPM"
            value={formatValue("rpm", metrics.rpm)}
            iconColor="blue"
            range="0-1,500"
            status={metrics.rpm <= 1200
              ? "Normal"
              : metrics.rpm > 1200 && metrics.rpm <= 1500
                ? "Optimal"
                : "Warning"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <MetricCard
            title="Voltage"
            value={formatValue("voltage", metrics.voltage)}
            iconColor="yellow"
            range="220V ±5%"
            status={metrics.voltage < 209 || metrics.voltage > 231 ? "Warning" : "Stable"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <MetricCard
            title="Current"
            value={formatValue("current", metrics.current)}
            iconColor="purple"
            range="0-30A"
            status={getCurrentStatus(metrics.current)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 3v10h4l-5 5v-10H7l5-5z" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
          <MetricCard
            title="Energy Output"
            value={formatValue("kwh", metrics.kwh)}
            iconColor="green"
            range={isToday() ? `Today: ${todayKwh.toFixed(1)} kWh` : `${selectedDate.toLocaleDateString()}: ${todayKwh.toFixed(1)} kWh`}
            status={getKwhStatus(metrics.kwh)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 1v4m8-4v4" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Historical Data</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-teal-100/80">View data for:</span>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="bg-slate-800/50 border border-teal-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
              />
              <div className="text-sm text-teal-100/60 self-center">
                {formatDateDisplay(selectedDate)}
              </div>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Temperature & RPM</h3>
            <Line data={tempRpmChart} options={chartOptions} />
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Voltage & Current</h3>
            <Line data={voltageCurrentChart} options={chartOptions} />
          </div>
        </div>

        {/* Power Chart - Full width */}
        <div className="glass rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Power Output (kWh)</h3>
          <Line data={powerChart} options={chartOptions} />
        </div>

        {/* System Status */}
        <div className="glass rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">System Status</h3>
            {systemStatus.lastUpdate && (
              <span className="text-xs text-teal-100/60">
                Last update: {systemStatus.lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatusIndicator
              title="Turbine Operational"
              status={systemStatus.turbineOperational}
              description={systemStatus.turbineOperational ? "Turbine running normally" : "Turbine offline or in maintenance"}
            />
            <StatusIndicator
              title="Grid Connection Stable"
              status={systemStatus.gridConnection}
              description={systemStatus.gridConnection ? "Connected to power grid" : "Disconnected from grid"}
            />
            <StatusIndicator
              title="All Sensors Active"
              status={systemStatus.sensorsActive}
              description={systemStatus.sensorsActive ? "All sensors reporting data" : "Some sensors not responding"}
            />
          </div>

          {/* Alerts Section */}
          {systemStatus.alerts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-3 text-red-300">Active Alerts</h4>
              <div className="space-y-2">
                {systemStatus.alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs bg-red-400/20 hover:bg-red-400/30 px-2 py-1 rounded"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, iconColor, range, status, icon }) => {
  // Determine status color based on status text
  const getStatusColor = (status) => {
    if (status.includes("Warning") || status.includes("Overload")) return "text-red-400";
    if (status.includes("No Usage") || status.includes("No Load")) return "text-yellow-400";
    if (status.includes("Low Usage") || status.includes("Low Load")) return "text-green-400";
    if (status.includes("Normal Usage") || status.includes("Normal Load")) return "text-green-400";
    if (status.includes("High Usage") || status.includes("High Load")) return "text-orange-400";
    if (status.includes("Normal")) return "text-green-400";
    if (status.includes("Optimal")) return "text-green-400";
    if (status.includes("Stable")) return "text-green-400";
    return "text-green-400";
  };

  return (
    <div className="glass rounded-xl p-6 metric-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 bg-${iconColor}-500/20 rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm text-teal-100/80">{title}</span>
        </div>
        <span className={`text-xs ${getStatusColor(status)}`}>{status}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-teal-100/60">{range}</div>
    </div>
  );
};

const StatusIndicator = ({ title, status, description }) => (
  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
    <div className={`w-3 h-3 ${status ? "bg-green-400" : "bg-red-400"} rounded-full animate-pulse`}></div>
    <div>
      <div className="text-sm">{title}</div>
      <div className="text-xs text-teal-100/60">{description}</div>
    </div>
  </div>
);

export default Dashboard;
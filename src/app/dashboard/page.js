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

const Dashboard = () => {
  const ws = useRef(null);

  const [metrics, setMetrics] = useState({
    temperature: 0,
    rpm: 0,
    voltage: 0,
    kwh: 0,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    temperature: [],
    rpm: [],
    voltage: [],
    power: [],
  });

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimeout;

    const connectWebSocket = () => {
      ws.current = new WebSocket("wss://power-monitoring-backend.onrender.com/ws/data");

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        requestHistory(); // request initial history
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

          setChartData({
            labels,
            temperature: temperatureData,
            rpm: rpmData,
            voltage: voltageData,
            power: kwhData,
          });
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

  // Request history every 10 minutes
  useEffect(() => {
    const interval = setInterval(requestHistory, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const requestHistory = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const now = new Date();
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    if (now < start) start.setDate(start.getDate() - 1);
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
      default:
        return value;
    }
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

  const voltagePowerChart = {
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
        label: "Power (kWh)",
        data: chartData.power,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y1",
      },
    ],
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
              <h1 className="text-2xl font-bold">Wind Turbine Monitor</h1>
              <p className="text-teal-100/70">Real-time sensor monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-teal-100/80">System Online</span>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Temperature" value={formatValue("temperature", metrics.temperature)} iconColor="red" range="-10°C to 50°C" status="Normal" />
          <MetricCard title="RPM" value={formatValue("rpm", metrics.rpm)} iconColor="blue" range="1,200-1,500" status="Optimal" />
          <MetricCard title="Voltage" value={formatValue("voltage", metrics.voltage)} iconColor="yellow" range="220V ±5%" status="Stable" />
          <MetricCard title="Energy Output" value={formatValue("kwh", metrics.kwh)} iconColor="green" range="Today: +127 kWh" status="Generating" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Temperature & RPM (Last 24 Hours)</h3>
            <Line data={tempRpmChart} options={chartOptions} />
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Voltage & Power Output (Last 24 Hours)</h3>
            <Line data={voltagePowerChart} options={chartOptions} />
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Turbine Operational", "Grid Connection Stable", "All Sensors Active"].map((status) => (
              <div key={status} className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, iconColor, range, status }) => (
  <div className="glass rounded-xl p-6 metric-card">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 bg-${iconColor}-500/20 rounded-lg flex items-center justify-center`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke="currentColor" className={`text-${iconColor}-400`} strokeWidth="2" />
          </svg>
        </div>
        <span className="text-sm text-teal-100/80">{title}</span>
      </div>
      <span className="text-xs text-green-400">{status}</span>
    </div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-xs text-teal-100/60">{range}</div>
  </div>
);

export default Dashboard;

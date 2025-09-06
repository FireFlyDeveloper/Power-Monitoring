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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
    ws.current = new WebSocket("ws://localhost:3001/ws/data");

    ws.current.onopen = () => {
      console.log("WebSocket connected");

      // Request historical data example
      const start = new Date("2025-09-01T00:00:00.000Z");
      const end = new Date("2025-09-05T23:59:59.999Z");
      ws.current.send(
        JSON.stringify({
          action: "getHistory",
          start: start.toISOString(),
          end: end.toISOString(),
        })
      );
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Handle real-time sensor updates
      if (message.data?.action === "update") {
        setMetrics((prev) => ({
          ...prev,
          ...message.data.data, // update only the sensors provided
        }));
      }

      // Handle lastData response
      if (message.action === "lastData") {
        setMetrics({
          temperature: message.data.temperature,
          rpm: message.data.rpm,
          voltage: message.data.voltage,
          kwh: message.data.kwh,
        });
      }

      // Handle historical data for charts
      if (message.action === "history") {
        const history = message.data;
        const labels = history.map((d) => new Date(d.created_at).toLocaleString());

        const temperatureData = history
          .filter((d) => d.sensor_type === "temperature")
          .map((d) => parseFloat(d.avg_value));
        const rpmData = history
          .filter((d) => d.sensor_type === "rpm")
          .map((d) => parseFloat(d.avg_value));
        const voltageData = history
          .filter((d) => d.sensor_type === "voltage")
          .map((d) => parseFloat(d.avg_value));
        const kwhData = history
          .filter((d) => d.sensor_type === "kwh")
          .map((d) => parseFloat(d.avg_value));

        setChartData({
          labels,
          temperature: temperatureData,
          rpm: rpmData,
          voltage: voltageData,
          power: kwhData,
        });
      }
    };

    ws.current.onclose = () => console.log("WebSocket disconnected");

    return () => ws.current.close();
  }, []);

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

  // Chart configs
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

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "white" } } },
    scales: {
      x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
      y: { type: "linear", display: true, position: "left", ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
      y1: { type: "linear", display: true, position: "right", ticks: { color: "white" }, grid: { drawOnChartArea: false } },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Wind Turbine Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.keys(metrics).map((key) => (
          <MetricCard key={key} title={key.toUpperCase()} value={formatValue(key, metrics[key])} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Temperature & RPM (History)</h3>
          <Line data={tempRpmChart} options={chartOptions} />
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Voltage & Power Output (History)</h3>
          <Line data={voltagePowerChart} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value }) => (
  <div className="glass rounded-xl p-6 metric-card transition-transform hover:-translate-y-1 hover:shadow-lg">
    <h4 className="text-sm text-teal-100/80">{title}</h4>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default Dashboard;

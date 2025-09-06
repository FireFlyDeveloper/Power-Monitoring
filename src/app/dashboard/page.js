'use client';

import React, { useEffect, useState } from "react";
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

const generateHourlyData = () => {
  const hours = [];
  const temperature = [];
  const rpm = [];
  const voltage = [];
  const power = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    hours.push(hour.getHours() + ":00");

    temperature.push(20 + Math.random() * 10 + Math.sin(i * 0.3) * 3);
    rpm.push(1200 + Math.random() * 300 + Math.sin(i * 0.2) * 100);
    voltage.push(220 + Math.random() * 20 + Math.sin(i * 0.4) * 10);
    power.push(2000 + Math.random() * 1000 + Math.sin(i * 0.25) * 500);
  }

  return { hours, temperature, rpm, voltage, power };
};

const Dashboard = () => {
  const [temperature, setTemperature] = useState("23.5°C");
  const [rpm, setRpm] = useState("1,247");
  const [voltage, setVoltage] = useState("223.4V");
  const [kwh, setKwh] = useState("2,847 kWh");

  const [chartData, setChartData] = useState(generateHourlyData());

  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature((20 + Math.random() * 10).toFixed(1) + "°C");
      setRpm(Math.floor(1200 + Math.random() * 300).toLocaleString());
      setVoltage((220 + Math.random() * 20).toFixed(1) + "V");
      setKwh((prev) => {
        const currentKwh = parseInt(prev.replace(/[^\d]/g, ""));
        return (currentKwh + Math.floor(Math.random() * 3)).toLocaleString() + " kWh";
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const tempRpmChart = {
    labels: chartData.hours,
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
    labels: chartData.hours,
    datasets: [
      {
        label: "Voltage (V)",
        data: chartData.voltage,
        borderColor: "rgb(234, 179, 8)",
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        yAxisID: "y",
      },
      {
        label: "Power (kW)",
        data: chartData.power,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "white" },
      },
    },
    scales: {
      x: {
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        ticks: { color: "white" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        ticks: { color: "white" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white relative p-6 overflow-hidden">
      {/* Background floats */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-cyan-400/5 animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-emerald-400/5 animate-[float_6s_ease-in-out_infinite] animation-delay-[-2s]"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-teal-400/5 animate-[float_6s_ease-in-out_infinite] animation-delay-[-4s]"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center justify-center w-12 h-12 glass rounded-xl animate-[energyPulse_2s_ease-in-out_infinite]">
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
            <h1 className="text-2xl font-bold">Wind Turbine Monitor</h1>
            <p className="text-teal-100/70">Real-time sensor monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="status-indicator bg-green-400"></div>
          <span className="text-sm text-teal-100/80">System Online</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        {/* Temperature */}
        <MetricCard
          color="red"
          iconPath="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
          title="Temperature"
          status="Normal"
          value={temperature}
          range="Range: -10°C to 50°C"
        />
        {/* RPM */}
        <MetricCard
          color="blue"
          iconPath="M12 1v6m0 6v6m11-7h-6m-6 0H1"
          title="RPM"
          status="Optimal"
          value={rpm}
          range="Target: 1,200-1,500"
        />
        {/* Voltage */}
        <MetricCard
          color="yellow"
          iconPath="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
          title="Voltage"
          status="Stable"
          value={voltage}
          range="Nominal: 220V ±5%"
        />
        {/* Energy Output */}
        <MetricCard
          color="green"
          iconPath="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"
          title="Energy Output"
          status="Generating"
          value={kwh}
          range="Today: +127 kWh"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
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
      <div className="mt-8 glass rounded-xl p-6 relative z-10">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusItem text="Turbine Operational" />
          <StatusItem text="Grid Connection Stable" />
          <StatusItem text="All Sensors Active" />
        </div>
      </div>
    </div>
  );
};

// MetricCard Component
const MetricCard = ({ color, iconPath, title, status, value, range }) => (
  <div className="glass rounded-xl p-6 metric-card transition-transform hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d={iconPath} stroke="currentColor" className={`text-${color}-400`} strokeWidth="2" />
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
const StatusItem = ({ text }) => (
  <div className="flex items-center space-x-3">
    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
    <span className="text-sm">{text}</span>
  </div>
);

export default Dashboard;

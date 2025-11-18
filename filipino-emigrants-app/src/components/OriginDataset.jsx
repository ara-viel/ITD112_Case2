import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  getOrigin,
  addOrigin,
  updateOrigin,
  deleteOrigin,
  deleteAllOrigin,
} from "../services/originService";
import OriginCSV from "../csv/OriginCSV";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(ChartDataLabels);

const OriginDataset = () => {
  const [origin, setOrigin] = useState([]);
  const [form, setForm] = useState({
    province: "",
    ...Object.fromEntries(Array.from({ length: 33 }, (_, i) => [1988 + i, ""])),
  });
  const [showRecords, setShowRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [selectedYear, setSelectedYear] = useState("All");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  const barChartRef = useRef(null);

  useEffect(() => {
    fetch("/src/data/Provinces.json")
      .then((res) => res.json())
      .then((geojson) => setGeoData(geojson))
      .catch((err) => console.error("❌ Failed to load GeoJSON:", err));
  }, []);

  const fetchData = async () => {
    const data = await getOrigin();
    const cleaned = data.map((d) => ({
      id: d.id,
      province: d.province || "",
      ...Object.fromEntries(
        Array.from({ length: 33 }, (_, i) => {
          const year = 1988 + i;
          return [year, Number(d[year] || 0)];
        })
      ),
    }));
    setOrigin(cleaned);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    if (!form.province.trim()) {
      alert("Please enter a province name.");
      return;
    }
    await addOrigin(form);
    alert("✅ Record added successfully!");
    setForm({
      province: "",
      ...Object.fromEntries(Array.from({ length: 33 }, (_, i) => [1988 + i, ""])),
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteOrigin(id);
      fetchData();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠ Are you sure you want to delete ALL records?")) {
      await deleteAllOrigin();
      fetchData();
    }
  };

  const filteredData = origin.filter((item) =>
    item.province.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const years = Array.from({ length: 33 }, (_, i) => 1988 + i);

  const chartData = useMemo(() => {
    return origin.map((item) => {
      const total =
        selectedYear === "All"
          ? Object.keys(item)
              .filter((k) => !["id", "province"].includes(k))
              .reduce((sum, yr) => sum + Number(item[yr] || 0), 0)
          : Number(item[selectedYear] || 0);
      return { province: item.province, value: total };
    });
  }, [origin, selectedYear]);

  // Top 10 provinces data
  const top10Data = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [chartData]);

  const maxValue = Math.max(...chartData.map((d) => d.value || 0), 1);
  const colorScale = scaleSequential()
    .domain([0, maxValue])
    .interpolator((t) => interpolateBlues(0.3 + 0.7 * t));

  const cleanName = (name) =>
    name?.toLowerCase().replace(/province|city|municipality/g, "").trim();

  // Render Top 10 Bar Chart
  useEffect(() => {
    let chartInstance;
    if (barChartRef.current && top10Data.length > 0) {
      chartInstance = new Chart(barChartRef.current, {
        type: "bar",
        data: {
          labels: top10Data.map(d => d.province),
          datasets: [{
            label: "Number of Emigrants",
            data: top10Data.map(d => d.value),
            backgroundColor: [
              "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
              "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
            ],
            borderRadius: 6,
            barThickness: 40,
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Top 10 Provinces by Emigration (${selectedYear === "All" ? "All Years" : selectedYear})`,
              font: { size: 18, weight: "600", family: "'Inter', sans-serif" },
              padding: { bottom: 20 }
            },
            datalabels: {
              anchor: "end",
              align: "end",
              color: "#1e293b",
              font: { weight: "600", size: 12 },
              formatter: (value) => value.toLocaleString(),
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: "rgba(0,0,0,0.05)" },
              title: { 
                display: true, 
                text: "Number of Emigrants",
                font: { size: 13 }
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                font: { size: 12, weight: "500" }
              }
            }
          }
        }
      });
    }
    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  }, [top10Data, selectedYear]);

  const buttonStyle = (color) => ({
    padding: "10px 20px",
    backgroundColor: color,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  });

  return (
    <div style={{ padding: "0", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ 
        marginBottom: "32px",
        paddingBottom: "24px",
        borderBottom: "2px solid #e5e7eb"
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1e293b",
          margin: "0 0 8px 0",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "32px" }}>📍</span>
          Origin Dataset - Philippines
        </h1>
        <p style={{ 
          fontSize: "14px", 
          color: "#64748b", 
          margin: 0 
        }}>
          Provincial emigration data from 1988 to 2020
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={buttonStyle(showForm ? "#ef4444" : "#10b981")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          {showForm ? "✖ Close Form" : "➕ Add Record"}
        </button>

        <OriginCSV collectionName="orig" />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="yearFilter" style={{ 
            fontSize: "14px", 
            fontWeight: "500",
            color: "#475569"
          }}>
            Filter Year:
          </label>
          <select
            id="yearFilter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
              backgroundColor: "#fff",
              fontWeight: "500"
            }}
          >
            <option value="All">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ 
            margin: "0 0 16px 0", 
            color: "#1e293b",
            fontSize: "16px",
            fontWeight: "600"
          }}>
            Add New Province Record
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "12px",
            marginBottom: "16px"
          }}>
            {Object.keys(form).map((key) => (
              <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ 
                  fontSize: "11px", 
                  color: "#64748b", 
                  marginBottom: "4px",
                  fontWeight: "500"
                }}>
                  {key}
                </label>
                <input
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAdd}
            style={buttonStyle("#3b82f6")}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            💾 Save Record
          </button>
        </div>
      )}

      {/* Search and Toggle */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "24px",
        flexWrap: "wrap"
      }}>
        <input
          type="text"
          placeholder="🔍 Search by province name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1",
            minWidth: "250px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
        />
        <button 
          onClick={() => setShowRecords(!showRecords)}
          style={buttonStyle(showRecords ? "#6366f1" : "#8b5cf6")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          {showRecords ? "👁️ Hide Records" : "👁️ Show Records"}
        </button>
      </div>

      {/* Records Table */}
      {showRecords && (
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "16px"
          }}>
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: "600" }}>
              Province Records
            </h3>
            <button
              onClick={handleDeleteAll}
              style={{
                ...buttonStyle("#dc2626"),
                padding: "8px 16px",
                fontSize: "13px"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#b91c1c"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#dc2626"}
            >
              🗑️ Delete All
            </button>
          </div>
          <div style={{
            maxHeight: "500px",
            overflowY: "auto",
            overflowX: "auto",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              fontSize: "13px"
            }}>
              <thead style={{ 
                position: "sticky", 
                top: 0, 
                background: "#f8fafc",
                zIndex: 10
              }}>
                <tr>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Province
                  </th>
                  {years.map((y) => (
                    <th key={y} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#475569",
                      borderBottom: "2px solid #e2e8f0",
                      fontSize: "12px"
                    }}>
                      {y}
                    </th>
                  ))}
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((e, idx) => (
                  <tr key={e.id} style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc"
                  }}>
                    <td style={{ 
                      padding: "12px 16px", 
                      borderBottom: "1px solid #e2e8f0", 
                      color: "#334155",
                      fontWeight: "500"
                    }}>
                      {e.province}
                    </td>
                    {years.map((y) => (
                      <td key={y} style={{ 
                        padding: "12px 16px", 
                        borderBottom: "1px solid #e2e8f0", 
                        color: "#334155" 
                      }}>
                        {e[y]}
                      </td>
                    ))}
                    <td style={{ 
                      padding: "12px 16px", 
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      gap: "8px"
                    }}>
                      <button 
                        onClick={() => {
                          setEditForm(e);
                          setEditModalVisible(true);
                        }}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalVisible && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "900px",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <h3 style={{
              margin: "0 0 24px 0",
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              ✏️ Edit Province Record
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                color: "#64748b", 
                marginBottom: "6px",
                fontWeight: "500"
              }}>
                Province Name
              </label>
              <input
                name="province"
                value={editForm.province}
                onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", 
              gap: "12px",
              marginBottom: "24px"
            }}>
              {years.map((y) => (
                <div key={y}>
                  <label style={{ 
                    display: "block",
                    fontSize: "11px", 
                    color: "#64748b",
                    marginBottom: "4px",
                    textAlign: "center",
                    fontWeight: "500"
                  }}>
                    {y}
                  </label>
                  <input
                    type="number"
                    name={y}
                    value={editForm[y]}
                    onChange={(e) => setEditForm({ ...editForm, [y]: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      textAlign: "center",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={async () => {
                  await updateOrigin(editForm.id, editForm);
                  setEditModalVisible(false);
                  fetchData();
                }}
                style={buttonStyle("#10b981")}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
              >
                ✓ Save Changes
              </button>
              <button
                onClick={() => setEditModalVisible(false)}
                style={buttonStyle("#64748b")}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#475569"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#64748b"}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Bar Chart */}
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
      }}>
        <div style={{ height: "500px" }}>
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>

      {/* Map */}
      <div style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        position: "relative"
      }}>
        <h3 style={{
          margin: "0 0 20px 0",
          color: "#1e293b",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          Philippines Province Heatmap
        </h3>
        <div style={{ width: "100%", height: "700px" }}>
          {geoData ? (
            <>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 3000, center: [122, 12.5] }}
                width={800}
                height={900}
                style={{ width: "100%", height: "100%" }}
              >
                <Geographies geography={geoData}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const provinceName = geo.properties?.PROVINCE || geo.properties?.name;
                      const provinceData = chartData.find(
                        (p) => cleanName(p.province) === cleanName(provinceName)
                      );
                      const color = provinceData ? colorScale(provinceData.value) : "#e5e7eb";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={color}
                          stroke="#475569"
                          strokeWidth={0.5}
                          onMouseEnter={(e) => setTooltip({
                            visible: true,
                            x: e.clientX,
                            y: e.clientY,
                            text: provinceData
                              ? `${provinceData.province}: ${provinceData.value.toLocaleString()} emigrants`
                              : `${provinceName}: No data`
                          })}
                          onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, text: "" })}
                          style={{
                            default: { outline: "none", transition: "all 0.2s" },
                            hover: { fill: "#f59e0b", cursor: "pointer", outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>

              {/* Legend */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginTop: "20px",
                padding: "12px 20px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}>
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Low</span>
                <div style={{
                  width: "200px",
                  height: "12px",
                  background: "linear-gradient(to right, #e5e7eb, #93c5fd, #1e40af)",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1"
                }} />
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>High</span>
              </div>
            </>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#64748b",
              fontSize: "16px"
            }}>
              🗺️ Loading Philippines map...
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div style={{
          position: "fixed",
          top: tooltip.y + 15,
          left: tooltip.x + 15,
          background: "rgba(15,23,42,0.95)",
          color: "#fff",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "500",
          pointerEvents: "none",
          zIndex: 9999,
          boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default OriginDataset;
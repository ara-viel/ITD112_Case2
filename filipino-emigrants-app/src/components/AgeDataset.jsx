import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AgeCSV from "../csv/AgeCSV";
import { getAge, addAge, updateAge, deleteAge, deleteAllAge } from "../services/ageService";

Chart.register(ChartDataLabels);

const AgeDataset = () => {
  const [age, setAge] = useState([]);
  const [form, setForm] = useState({
    ageGroup: "",
    ...Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [1981 + i, ""])
    ),
    notReported: "",
  });
  const [showRecords, setShowRecords] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const lineRef = useRef(null);
  const barRef = useRef(null);

  const fetchData = async () => {
    const data = await getAge();
    const cleaned = data.map((d) => ({
      id: d.id,
      ageGroup: d.ageGroup || "",
      ...Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => {
          const year = 1981 + i;
          return [year, Number(d[year] || 0)];
        })
      ),
    }));
    cleaned.sort((a, b) => {
      const getStartAge = (group) => {
        const match = group.match(/\d+/);
        return match ? parseInt(match[0]) : 9999;
      };
      return getStartAge(a.ageGroup) - getStartAge(b.ageGroup);
    });
    setAge(cleaned);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    if (!form.ageGroup.trim()) {
      alert("⚠️ Please enter an age group.");
      return;
    }
    const invalidYear = Object.entries(form).find(([key, value]) => {
      if (!isNaN(key)) {
        return value !== "" && isNaN(Number(value));
      }
      return false;
    });
    if (invalidYear) {
      alert(`⚠️ Invalid value in year ${invalidYear[0]}. Please enter numbers only.`);
      return;
    }
    await addAge(form);
    alert("✅ Record added successfully!");
    setForm({
      ageGroup: "",
      ...Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [1981 + i, ""])
      ),
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteAge(id);
      fetchData();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠ Are you sure you want to delete ALL records?")) {
      await deleteAllAge();
      fetchData();
    }
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    setEditForm({ ...record });
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleSaveEdit = async () => {
    await updateAge(editId, editForm);
    setEditId(null);
    fetchData();
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const filteredData = age.filter((item) =>
    item.ageGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const years = Array.from({ length: 40 }, (_, i) => 1981 + i);

  const colors = [
    "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
    "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#06b6d4",
    "#84cc16", "#f43f5e", "#a855f7", "#22c55e", "#eab308"
  ];

  const lineData = {
    labels: years,
    datasets: filteredData.map((a, i) => ({
      label: a.ageGroup,
      data: years.map((y) => a[y]),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + "20",
      fill: false,
      tension: 0.4,
      borderWidth: 2.5,
    })),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "bottom",
        labels: {
          padding: 15,
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      title: { 
        display: true, 
        text: "Age Group Trends Over Time",
        font: { size: 18, weight: "600", family: "'Inter', sans-serif" },
        padding: { bottom: 20 }
      },
      tooltip: { enabled: true },
      datalabels: { display: false },
    },
    elements: {
      point: { radius: 3, hoverRadius: 7 },
      line: { tension: 0.4, borderWidth: 2.5 },
    },
    scales: {
      x: { 
        title: { display: true, text: "Year", font: { size: 13 } },
        grid: { display: false }
      },
      y: { 
        title: { display: true, text: "Number of Emigrants", font: { size: 13 } },
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" }
      },
    },
  };

  const barData = {
    labels: years,
    datasets: filteredData.map((a, i) => ({
      label: a.ageGroup,
      data: years.map((y) => a[y]),
      backgroundColor: colors[i % colors.length],
    })),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "bottom",
        labels: {
          padding: 15,
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      title: { 
        display: true, 
        text: "Age Group Composition (Stacked)",
        font: { size: 18, weight: "600", family: "'Inter', sans-serif" },
        padding: { bottom: 20 }
      },
      datalabels: { display: false },
    },
    scales: {
      x: { 
        stacked: true, 
        title: { display: true, text: "Year", font: { size: 13 } },
        grid: { display: false }
      },
      y: { 
        stacked: true, 
        title: { display: true, text: "Total Emigrants", font: { size: 13 } },
        grid: { color: "rgba(0,0,0,0.05)" }
      },
    },
  };

  useEffect(() => {
    let lineChart, barChart;
    if (lineRef.current) {
      lineChart = new Chart(lineRef.current, { type: "line", data: lineData, options: lineOptions });
    }
    if (barRef.current) {
      barChart = new Chart(barRef.current, { type: "bar", data: barData, options: barOptions });
    }
    return () => {
      if (lineChart) lineChart.destroy();
      if (barChart) barChart.destroy();
    };
  }, [filteredData]);

  const buttonStyle = (color, hoverColor) => ({
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
      {/* Header Section */}
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
          <span style={{ fontSize: "32px" }}>📊</span>
          Age Dataset Analysis
        </h1>
        <p style={{ 
          fontSize: "14px", 
          color: "#64748b", 
          margin: 0 
        }}>
          Emigration data from 1981 to 2020
        </p>
      </div>

      {/* Action Buttons */}
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
        <AgeCSV collectionName="age" />
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
            Add New Record
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
                  color: "#7c3aed", 
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
                    border: "1px solid #d8b4fe",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
                  onBlur={(e) => e.target.style.borderColor = "#d8b4fe"}
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
          placeholder="🔍 Search by age group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1",
            minWidth: "250px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #d8b4fe",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
          onBlur={(e) => e.target.style.borderColor = "#d8b4fe"}
        />
        <button 
          onClick={() => setShowRecords(!showRecords)}
          style={buttonStyle(showRecords ? "#a855f7" : "#8b5cf6")}
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
              Data Records
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
            border: "1px solid #e9d5ff"
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              fontSize: "13px"
            }}>
              <thead style={{ 
                position: "sticky", 
                top: 0, 
                background: "#faf5ff",
                zIndex: 10
              }}>
                <tr>
                  <th style={tableHeaderStyle}>Age Group</th>
                  {years.map((y) => (
                    <th key={y} style={tableHeaderStyle}>{y}</th>
                  ))}
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((e, idx) => (
                  <tr key={e.id} style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#faf5ff"
                  }}>
                    <td style={tableCellStyle}>{e.ageGroup}</td>
                    {years.map((y) => (
                      <td key={y} style={tableCellStyle}>{e[y]}</td>
                    ))}
                    <td style={{...tableCellStyle, display: "flex", gap: "8px"}}>
                      <button 
                        onClick={() => handleEdit(e)}
                        style={smallButtonStyle("#8b5cf6")}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        style={smallButtonStyle("#ef4444")}
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
      {editId && (
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
              color: "#6b21a8",
              fontSize: "20px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              ✏️ Edit Age Record
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                color: "#7c3aed", 
                marginBottom: "6px",
                fontWeight: "500"
              }}>
                Age Group
              </label>
              <input
                name="ageGroup"
                value={editForm.ageGroup}
                onChange={handleEditChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d8b4fe",
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
                    color: "#7c3aed",
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
                    onChange={handleEditChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #d8b4fe",
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
                onClick={handleSaveEdit}
                style={buttonStyle("#8b5cf6")}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#7c3aed"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#8b5cf6"}
              >
                ✓ Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
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

      {/* Charts */}
      <div style={{
        display: "grid",
        gap: "32px",
        marginTop: "32px"
      }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ height: "500px" }}>
            <canvas ref={lineRef}></canvas>
          </div>
        </div>
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ height: "500px" }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

const tableHeaderStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: "600",
  color: "#6b21a8",
  borderBottom: "2px solid #e2e8f0",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tableCellStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155"
};

const smallButtonStyle = (color) => ({
  padding: "6px 10px",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  transition: "all 0.2s ease"
});

export default AgeDataset;
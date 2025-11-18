import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import CSVUpload from "../components/CSVUpload";
import {
  getEmigrants,
  addEmigrant,
  updateEmigrant,
  deleteEmigrant,
  deleteAllEmigrant
} from "../services/emigrantsService";

Chart.register(ChartDataLabels);

const CivilStatusDataset = () => {
  const [civilStatus, setCivilStatus] = useState([]);
  const [form, setForm] = useState({
    year: "",
    single: "",
    married: "",
    widower: "",
    separated: "",
    divorced: "",
    notReported: "",
  });
  const [selectedYear, setSelectedYear] = useState("All");
  const [availableYears, setAvailableYears] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const barRef = useRef(null);
  const doughnutRef = useRef(null);

  const fetchData = async () => {
    const data = await getEmigrants();
    const cleaned = data.map((d) => ({
      id: d.id,
      year: Number(d.year || d.YEAR || 0),
      single: Number(d.single || d.Single || 0),
      married: Number(d.married || d.Married || 0),
      widower: Number(d.widower || d.Widower || 0),
      separated: Number(d.separated || d.Separated || 0),
      divorced: Number(d.divorced || d.Divorced || 0),
      notReported: Number(d.notReported || d["Not Reported"] || 0),
    }));

    const sorted = [...cleaned].sort((a, b) => a.year - b.year);
    const years = [...new Set(cleaned.map((d) => d.year))].sort((a, b) => a - b);

    setAvailableYears(years);
    setCivilStatus(sorted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    const numericFields = ["year", "single", "married", "widower", "separated", "divorced", "notReported"];
    
    for (const field of numericFields) {
      const value = form[field].trim();
      if (value === "" || isNaN(value)) {
        alert(`❌ Invalid input: ${field} must be a number.`);
        return;
      }
    }

    await addEmigrant({
      year: Number(form.year),
      single: Number(form.single),
      married: Number(form.married),
      widower: Number(form.widower),
      separated: Number(form.separated),
      divorced: Number(form.divorced),
      notReported: Number(form.notReported),
    });

    alert("✅ Record successfully added!");
    setForm({
      year: "",
      single: "",
      married: "",
      widower: "",
      separated: "",
      divorced: "",
      notReported: "",
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteEmigrant(id);
      fetchData();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠ Are you sure you want to delete ALL records?")) {
      await deleteAllEmigrant();
      fetchData();
    }
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    setEditForm({ ...record });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    await updateEmigrant(editId, {
      year: Number(editForm.year),
      single: Number(editForm.single),
      married: Number(editForm.married),
      widower: Number(editForm.widower),
      separated: Number(editForm.separated),
      divorced: Number(editForm.divorced),
      notReported: Number(editForm.notReported),
    });
    setEditId(null);
    fetchData();
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const filteredData = civilStatus.filter((item) => {
    const matchesYear = selectedYear === "All" || item.year === parseInt(selectedYear);
    const matchesSearch = searchQuery
      ? Object.values(item).join(" ").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesYear && matchesSearch;
  });

  const totals = filteredData.reduce(
    (acc, cur) => {
      acc.single += cur.single || 0;
      acc.married += cur.married || 0;
      acc.widower += cur.widower || 0;
      acc.separated += cur.separated || 0;
      acc.divorced += cur.divorced || 0;
      acc.notReported += cur.notReported || 0;
      return acc;
    },
    { single: 0, married: 0, widower: 0, separated: 0, divorced: 0, notReported: 0 }
  );

  const chartData = {
    labels: ["Civil Status Distribution"],
    datasets: [
      { label: "Single", data: [totals.single], backgroundColor: "#3b82f6" },
      { label: "Married", data: [totals.married], backgroundColor: "#10b981" },
      { label: "Widower", data: [totals.widower], backgroundColor: "#8b5cf6" },
      { label: "Separated", data: [totals.separated], backgroundColor: "#f59e0b" },
      { label: "Divorced", data: [totals.divorced], backgroundColor: "#ef4444" },
      { label: "Not Reported", data: [totals.notReported], backgroundColor: "#6b7280" },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
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
        text: "Civil Status Distribution",
        font: { size: 18, weight: "600", family: "'Inter', sans-serif" },
        padding: { bottom: 20 }
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 13 },
        formatter: (value) => value.toLocaleString(),
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: "Number of Emigrants", font: { size: 13 } },
        grid: { color: "rgba(0,0,0,0.05)" }
      },
      y: { 
        stacked: true,
        grid: { display: false }
      },
    },
  };

  const doughnutData = {
    labels: ["Single", "Married", "Widower", "Separated", "Divorced", "Not Reported"],
    datasets: [
      {
        data: [
          totals.single,
          totals.married,
          totals.widower,
          totals.separated,
          totals.divorced,
          totals.notReported,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"],
        borderColor: "#fff",
        borderWidth: 3,
      },
    ],
  };

  const doughnutOptions = {
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
        text: `Civil Status Breakdown (${selectedYear === "All" ? "All Years" : selectedYear})`,
        font: { size: 18, weight: "600", family: "'Inter', sans-serif" },
        padding: { bottom: 20 }
      },
    },
  };

  useEffect(() => {
    let barChartInstance;
    let doughnutChartInstance;

    if (barRef.current) {
      barChartInstance = new Chart(barRef.current, {
        type: "bar",
        data: chartData,
        options: chartOptions,
      });
    }

    if (doughnutRef.current) {
      doughnutChartInstance = new Chart(doughnutRef.current, {
        type: "doughnut",
        data: doughnutData,
        options: doughnutOptions,
      });
    }

    return () => {
      if (barChartInstance) barChartInstance.destroy();
      if (doughnutChartInstance) doughnutChartInstance.destroy();
    };
  }, [chartData, doughnutData, selectedYear]);

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

  const formFields = [
    { name: "year", label: "Year", type: "number" },
    { name: "single", label: "Single", type: "number" },
    { name: "married", label: "Married", type: "number" },
    { name: "widower", label: "Widower", type: "number" },
    { name: "separated", label: "Separated", type: "number" },
    { name: "divorced", label: "Divorced", type: "number" },
    { name: "notReported", label: "Not Reported", type: "number" },
  ];

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
          <span style={{ fontSize: "32px" }}>💍</span>
          Civil Status Dataset
        </h1>
        <p style={{ 
          fontSize: "14px", 
          color: "#64748b", 
          margin: 0 
        }}>
          Emigration data by marital status from 1988 to 2020
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
        <CSVUpload collectionName="civilStatus" />
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
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "16px"
          }}>
            {formFields.map((field) => (
              <div key={field.name} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ 
                  fontSize: "12px", 
                  color: "#64748b", 
                  marginBottom: "4px",
                  fontWeight: "500"
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
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

      {/* Search and Filters */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "24px",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="🔍 Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1",
            minWidth: "200px",
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
        
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            cursor: "pointer",
            outline: "none",
            backgroundColor: "#fff"
          }}
        >
          <option value="All">All Years</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

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
                  {["Year", "Single", "Married", "Widower", "Separated", "Divorced", "Not Reported", "Actions"].map(header => (
                    <th key={header} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#475569",
                      borderBottom: "2px solid #e2e8f0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((e, idx) => (
                  <tr key={e.id} style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc"
                  }}>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.year}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.single}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.married}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.widower}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.separated}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.divorced}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>{e.notReported}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => handleEdit(e)}
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
            maxWidth: "500px",
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
              ✏️ Edit Civil Status Record
            </h3>
            
            {formFields.map((field) => (
              <div key={field.name} style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  color: "#64748b", 
                  marginBottom: "6px",
                  fontWeight: "500"
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={editForm[field.name]}
                  onChange={handleEditChange}
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
            ))}
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                onClick={handleSaveEdit}
                style={buttonStyle("#10b981")}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
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
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
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
          <div style={{ height: "400px" }}>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
        <div style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}>
          <div style={{ height: "400px" }}>
            <canvas ref={doughnutRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilStatusDataset;
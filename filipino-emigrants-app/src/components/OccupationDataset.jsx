import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ReactECharts from "echarts-for-react";
import OccuCSV from "../csv/OccuCSV";
import { getOccu, addOccu, updateOccu, deleteOccu, deleteAllOccu } from "../services/occuService";

Chart.register(ChartDataLabels);

const OccupationDataset = () => {
  const [occu, setOccu] = useState([]);
  const [form, setForm] = useState({
    occupation: "",
    ...Object.fromEntries(Array.from({ length: 40 }, (_, i) => [1981 + i, ""])),
  });
  const [showRecords, setShowRecords] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const lineRef = React.useRef(null);

  // 🔹 Fetch Data
  const fetchData = async () => {
    const data = await getOccu();
    const cleaned = data.map((d) => ({
      id: d.id,
      occupation: d.occupation || "",
      ...Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => {
          const year = 1981 + i;
          return [year, Number(d[year] || 0)];
        })
      ),
    }));
    setOccu(cleaned);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Form Handlers
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAdd = async () => {
    await addOccu(form);
    alert("✅ Record added successfully!");
    setForm({
      occupation: "",
      ...Object.fromEntries(Array.from({ length: 40 }, (_, i) => [1981 + i, ""])),
    });
    fetchData();
  };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteOccu(id);
      fetchData();
    }
  };
  const handleDeleteAll = async () => {
        if (window.confirm("⚠ Are you sure you want to delete ALL records?")) {
          await deleteAllOccu();
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
    await updateOccu(editId, editForm);
    setEditId(null);
    fetchData();
  };
  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  // 🔹 Filter
  const filteredData = occu.filter((item) =>
    item.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const years = Array.from({ length: 40 }, (_, i) => 1981 + i);

  // 🎨 Colors
  const colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  ];

  // 🧩 Line Chart
  useEffect(() => {
    let chartInstance;
    if (lineRef.current) {
      const lineData = {
        labels: years,
        datasets: filteredData.map((o, i) => ({
          label: o.occupation,
          data: years.map((y) => o[y]),
          borderColor: colors[i % colors.length],
          fill: false,
          tension: 0.3,
        })),
      };
      const lineOptions = {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: "Occupation Trends Over Time (1981–2020)" },
          datalabels: { display: false },
        },
        elements: { point: { radius: 3, hoverRadius: 6 } },
        scales: {
          x: { title: { display: true, text: "Year" } },
          y: { title: { display: true, text: "Population" }, beginAtZero: true },
        },
      };

      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(lineRef.current, {
        type: "line",
        data: lineData,
        options: lineOptions,
      });
    }
    return () => chartInstance?.destroy();
  }, [filteredData]);

// 🧩 Scatterplot (Occupation vs Year)
const [selectedYear, setSelectedYear] = useState(2000);
const [selectedOccupation, setSelectedOccupation] = useState("");

const scatterData = occu
  .filter((o) =>
    selectedOccupation ? o.occupation === selectedOccupation : true
  )
  .map((o) => [Number(selectedYear), o[selectedYear], o.occupation]);

const scatterOptions = {
  title: {
    text: "Occupation Relationship Scatter Plot",
    left: "center",
  },
  tooltip: {
    trigger: "item",
    formatter: (params) => {
      return `
        <b>${params.data[2]}</b><br/>
        Year: ${params.data[0]}<br/>
        Count: ${params.data[1]}
      `;
    },
  },
  xAxis: {
    name: "Year",
    type: "value",
    min: 1981,
    max: 2020,
    interval: 5,
  },
  yAxis: {
    name: "Population",
    type: "value",
    min: 0,
  },
  series: [
    {
      symbolSize: 15,
      data: scatterData,
      type: "scatter",
      itemStyle: {
        color: "#1f77b4",
      },
      emphasis: {
        scale: true,
      },
    },
  ],
};




  return (
    <div style={{ padding: 20 }}>
      <h1
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "2rem",
          color: "#1e3a8a",
          marginBottom: "20px",
        }}>📊 Occupation Dataset (1981–2020)</h1>

      {/* 🔹 Add Record + CSV Upload */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "6px 12px",
            backgroundColor: showForm ? "#e74c3c" : "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showForm ? "✖ Close Form" : "➕ Add Record"}
        </button>

        <OccuCSV collectionName="occupation" />
      </div>

      {showForm && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            marginBottom: 20,
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          {Object.keys(form).map((key) => (
            <input
              key={key}
              name={key}
              placeholder={key}
              value={form[key]}
              onChange={handleChange}
              style={{
                margin: 5,
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          ))}
          <button
            onClick={handleAdd}
            style={{
              padding: "6px 12px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            💾 Save Record
          </button>
        </div>
      )}

      {/* 🔹 Search & Table */}
      <input
        type="text"
        placeholder="Search by occupation..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: 10, padding: "5px 10px", width: "300px" }}
      />
      <button onClick={() => setShowRecords(!showRecords)} style={{ marginLeft: 10 }}>
        {showRecords ? "Hide Records" : "Show Records"}
      </button>

      {showRecords && (

        <>
        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <button
            onClick={handleDeleteAll}
            style={{
              padding: "6px 12px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🗑️ Delete All Records
          </button>
         </div>

        <div style={{
         maxHeight: "400px",
            overflowY: "auto",
            overflowX: "auto",
            marginTop: 10,
            border: "1px solid #ccc",
            padding: 5,
            borderRadius: 6,
            background: "#f8f9fa",
          }}
        >
          <table 
            border="1" 
            cellPadding="5"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>Occupation</th>
                {years.map((y) => (
                  <th key={y}>{y}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((e) => (
                <tr key={e.id}>
                  {editId === e.id ? (
                    <>
                      {Object.keys(editForm).map(
                        (key) =>
                          key !== "id" && (
                            <td key={key}>
                              <input
                                name={key}
                                value={editForm[key]}
                                onChange={handleEditChange}
                                style={{ width: "70px" }}
                              />
                            </td>
                          )
                      )}
                      <td>
                        <button onClick={handleSaveEdit}>Save</button>
                        <button onClick={handleCancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{e.occupation}</td>
                      {years.map((y) => (
                        <td key={y}>{e[y]}</td>
                      ))}
                      <td>
                        <button onClick={() => handleEdit(e)}>✏️ Edit</button>
                        <button onClick={() => handleDelete(e.id)}>🗑️ Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}



{/* ✅ Edit Modal */}
{editId && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: "8px",
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <h3 
        style={{
          marginBottom: 15,
          color: "#1e3a8a",
          fontFamily: "Poppins, sans-serif",
          fontWeight: "600",
        }}
      >
        ✏️ Edit Occupation Record
      </h3>

      {/* Occupation Name */}
      <input
        name="occupation"
        value={editForm.occupation}
        onChange={handleEditChange}
        style={{ marginBottom: 10, width: "100%", padding: "6px" }}
      />

      {/* Year Fields */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {years.map((y) => (
          <div key={y} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: "#1e3a8a" }}>{y}</label>
            <input
              type="number"
              name={y}
              value={editForm[y]}
              onChange={handleEditChange}
              style={{
                width: "80px",
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                textAlign: "center",
              }}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleSaveEdit}
          style={{
            padding: "6px 12px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginRight: "10px",
          }}
        >
          Save
        </button>
        <button
          onClick={handleCancelEdit}
          style={{
            padding: "6px 12px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}





      {/* 🔹 Charts */}
      <div style={{ width: "100%", height: "600px", marginTop: 40 }}>
        <canvas ref={lineRef}></canvas>
      </div>

      {/* 🔹 Scatter Plot Section */}
<div
  style={{
    marginTop: "50px",
    background: "#f1f5f9",
    padding: "20px",
    borderRadius: "8px",
  }}
>
  <h2
    style={{
      fontFamily: "'Poppins', sans-serif",
      fontSize: "1.5rem",
      color: "#1e3a8a",
      marginBottom: "15px",
    }}
  >
    ⚙️ Occupation Scatter Plot (1981–2020)
  </h2>

  {/* Selection Control */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      flexWrap: "wrap",
      marginBottom: "20px",
    }}
  >
    <label>💼 Select Occupation:</label>
    <select
      value={selectedOccupation}
      onChange={(e) => setSelectedOccupation(e.target.value)}
      style={{
        padding: "6px",
        borderRadius: "6px",
        border: "1px solid #ccc",
      }}
    >
      <option value="">-- Select Occupation --</option>
      {occu.map((o) => (
        <option key={o.id} value={o.occupation}>
          {o.occupation}
        </option>
      ))}
    </select>
  </div>

  {/* Scatter Plot Chart */}
  <div style={{ width: "100%", height: "500px" }}>
    <ReactECharts
      option={{
        title: {
          text: selectedOccupation
            ? `Scatter Plot for ${selectedOccupation}`
            : "Select an Occupation to View Scatter Plot",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: (params) =>
            `<b>${params.data[2]}</b><br/>Year: ${params.data[0]}<br/>Count: ${params.data[1]}`,
        },
        xAxis: {
          name: "Year",
          type: "value",
          min: 1981,
          max: 2020,
          interval: 5,
          axisLabel: {
            formatter: (value) => value.toFixed(0), // 🔹 Removes commas
          },
        },

        yAxis: {
          name: "Population",
          type: "value",
          min: 0,
        },
        series: [
          {
            symbolSize: 12,
            data:
              selectedOccupation && occu.length > 0
                ? (() => {
                    const record = occu.find(
                      (o) => o.occupation === selectedOccupation
                    );
                    return record
                      ? Object.keys(record)
                          .filter((y) => !isNaN(Number(y)))
                          .map((y) => [
                            Number(y),
                            Number(record[y]),
                            selectedOccupation,
                          ])
                      : [];
                  })()
                : [],
            type: "scatter",
            itemStyle: { color: "#2563eb" },
            emphasis: { scale: true },
          },
        ],
      }}
      style={{ height: "500px" }}
    />
  </div>
</div>

      
    </div>
  );
};

export default OccupationDataset;

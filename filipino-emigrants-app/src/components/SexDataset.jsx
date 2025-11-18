import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import SexCSV from "../csv/SexCSV";
import { getSex, addSex, updateSex, deleteSex, deleteAllSex } from "../services/sexService";

Chart.register(ChartDataLabels);

const SexDataset = () => {
  // ─── STATE ────────────────────────────────────────────────
  const [sex, setSex] = useState([]);
  const [form, setForm] = useState({ year: "", male: "", female: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  // Independent chart filters
  const [filters, setFilters] = useState({
    lineYear: "All",
    barRange: "All",
  });

  // Chart references
  const lineRef = useRef(null);
  const barRef = useRef(null);
  const pyramidRef = useRef(null);

  // ─── FETCH DATA ────────────────────────────────────────────
  const fetchData = async () => {
    const data = await getSex();
    const cleaned = (data || [])
      .map((d) => ({
        id: d._id || d.id,
        year: Number(d.year),
        male: Number(d.male) || 0,
        female: Number(d.female) || 0,
      }))
      .sort((a, b) => a.year - b.year);
    setSex(cleaned);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── CRUD HANDLERS ────────────────────────────────────────
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    await addSex({
      year: Number(form.year) || 0,
      male: Number(form.male) || 0,
      female: Number(form.female) || 0,
    });
    alert("✅ Record added successfully!");
    setForm({ year: "", male: "", female: "" });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteSex(id);
      fetchData();
    }
  };
   const handleDeleteAll = async () => {
        if (window.confirm("⚠ Are you sure you want to delete ALL records?")) {
          await deleteAllSex();
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
    await updateSex(editId, {
      year: Number(editForm.year),
      male: Number(editForm.male),
      female: Number(editForm.female),
    });
    setEditId(null);
    setEditForm({});
    fetchData();
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  // ─── UTILITIES ─────────────────────────────────────────────
  const createYearRanges = (data) => {
    if (!data || data.length === 0) return [];
    const minYear = Math.floor(data[0].year / 5) * 5 + 1; // e.g. 1981
    const maxYear = Math.ceil(data[data.length - 1].year / 5) * 5; // e.g. 2020
    const ranges = [];
    for (let start = minYear; start <= maxYear; start += 5) {
      ranges.push(`${start}-${start + 4}`);
    }
    return ranges;
  };

  const yearRanges = createYearRanges(sex);
  const yearOptions = ["All", ...Array.from({ length: 33 }, (_, i) => 1988 + i)];

  const getGroupedData = (data) =>
    createYearRanges(data).map((range) => {
      const [start, end] = range.split("-").map(Number);
      const filtered = data.filter((d) => d.year >= start && d.year <= end);
      return {
        range,
        male: filtered.reduce((sum, d) => sum + d.male, 0),
        female: filtered.reduce((sum, d) => sum + d.female, 0),
      };
    });

  // ─── TABLE FILTER (SEARCH) ─────────────────────────────────
  const tableFiltered = searchQuery
    ? sex.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : sex;

  // ─── COLORS ────────────────────────────────────────────────
  const colors = { male: "#6c8ef7", female: "#ff885b" };

  // ─── LINE CHART ────────────────────────────────────────────
  const lineFiltered =
    filters.lineYear === "All"
      ? sex
      : sex.filter((d) => d.year === Number(filters.lineYear));

  const lineData = {
    labels: lineFiltered.map((d) => d.year),
    datasets: [
      {
        label: "Male",
        data: lineFiltered.map((d) => d.male),
        borderColor: colors.male,
        backgroundColor: colors.male,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Female",
        data: lineFiltered.map((d) => d.female),
        borderColor: colors.female,
        backgroundColor: colors.female,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Male vs Female Emigrants (Line Chart)" },
      datalabels: { display: false },
    },
    scales: {
      x: { title: { display: true, text: "Year" } },
      y: { beginAtZero: true, title: { display: true, text: "Population" } },
    },
  };

  // ─── GROUPED BAR CHART (5-year intervals) ───────────────────
  const groupedData = getGroupedData(sex);
  const barFiltered =
    filters.barRange === "All"
      ? groupedData
      : groupedData.filter((g) => g.range === filters.barRange);

  const groupedBarData = {
    labels: barFiltered.map((g) => g.range),
    datasets: [
      { label: "Male", data: barFiltered.map((g) => g.male), backgroundColor: colors.male },
      { label: "Female", data: barFiltered.map((g) => g.female), backgroundColor: colors.female },
    ],
  };

  const groupedBarOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Male vs Female (Grouped Bar by 5-Year Interval)" },
      datalabels: { display: false },
    },
    scales: {
      x: { title: { display: true, text: "Year Range" } },
      y: { beginAtZero: true, title: { display: true, text: "Total Population" } },
    },
  };

  // ─── POPULATION PYRAMID (All Intervals) ─────────────────────
// ─── POPULATION PYRAMID (All Years) ───────────────────────────
const allPyramidData = sex.sort((a, b) => a.year - b.year); // ensure ascending order
const pyramidData = {
  labels: allPyramidData.map((d) => d.year),
  datasets: [
    {
      label: "Male",
      data: allPyramidData.map((d) => -d.male), // negative for left side
      backgroundColor: colors.male,
    },
    {
      label: "Female",
      data: allPyramidData.map((d) => d.female),
      backgroundColor: colors.female,
    },
  ],
};

const pyramidOptions = {
  indexAxis: "y",
  responsive: true,
  plugins: {
    legend: { position: "bottom" },
    title: { display: true, text: "Population Pyramid by Sex (1981–2020, Yearly)" },
    datalabels: { display: false },
  },
  scales: {
    x: {
      title: { display: true, text: "Population" },
      ticks: {
        callback: (value) => Math.abs(value).toLocaleString(),
      },
      min: -50000,
      max: 50000,
    },
    y: {
      title: { display: true, text: "Year" },
      ticks: {
        autoSkip: false, // 👈 ensures all years are shown
      },
    },
  },
};


  // ─── RENDER CHARTS ─────────────────────────────────────────
  useEffect(() => {
    let lineChart, barChart, pyramidChart;

    if (lineRef.current)
      lineChart = new Chart(lineRef.current, { type: "line", data: lineData, options: lineOptions });

    if (barRef.current)
      barChart = new Chart(barRef.current, { type: "bar", data: groupedBarData, options: groupedBarOptions });

    if (pyramidRef.current)
      pyramidChart = new Chart(pyramidRef.current, { type: "bar", data: pyramidData, options: pyramidOptions });

    return () => {
      lineChart?.destroy();
      barChart?.destroy();
      pyramidChart?.destroy();
    };
  }, [sex, filters]);

  // ─── UI ────────────────────────────────────────────────────
  return (
    <div style={{ padding: 20 }}>
      <h1
      style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "2rem",
          color: "#1e3a8a",
          marginBottom: "20px",
        }}
      >🚻 Sex Dataset (Male vs Female Emigrants)</h1>

      {/* Add Record + CSV Upload */}
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
        <SexCSV collectionName="sex" />
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#f8f9fa", padding: 12, borderRadius: 8 }}>
          <input name="year" placeholder="year" value={form.year} onChange={handleChange} style={{ padding: 6 }} />
          <input name="male" placeholder="male" value={form.male} onChange={handleChange} style={{ padding: 6 }} />
          <input name="female" placeholder="female" value={form.female} onChange={handleChange} style={{ padding: 6 }} />
          <button onClick={handleAdd} style={{ padding: "6px 12px", backgroundColor: "#3498db", color: "#fff", border: "none", borderRadius: 6 }}>💾 Save Record</button>
        </div>
      )}

      {/* Search + Show Records */}
      <div style={{ marginBottom: 10 }}>
        <input type="text" placeholder="Search by year / male / female..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginRight: 10, padding: "6px 10px", width: 300 }} />
        <button onClick={() => setShowRecords(!showRecords)}>{showRecords ? "Hide Records" : "Show Records"}</button>
      </div>

      {/* Records Table */}
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
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Year</th>
                <th>Male</th>
                <th>Female</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableFiltered.map((e) => (
                <tr key={e.id}>
                  {editId === e.id ? (
                    <>
                      <td><input name="year" value={editForm.year} onChange={handleEditChange} style={{ width: 80 }} /></td>
                      <td><input name="male" value={editForm.male} onChange={handleEditChange} style={{ width: 80 }} /></td>
                      <td><input name="female" value={editForm.female} onChange={handleEditChange} style={{ width: 80 }} /></td>
                      <td>
                        <button onClick={handleSaveEdit}>Save</button>
                        <button onClick={handleCancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{e.year}</td>
                      <td>{e.male}</td>
                      <td>{e.female}</td>
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
        width: "400px",
        maxHeight: "60vh",
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
        ✏️ Edit Sex Record
      </h3>

      {/* Year */}
      <label style={{ fontWeight: "500" }}>Year</label>
      <input
        type="number"
        name="year"
        value={editForm.year}
        onChange={handleEditChange}
        style={{ marginBottom: 10, width: "100%", padding: "6px" }}
      />

      {/* Male */}
      <label style={{ fontWeight: "500" }}>Male</label>
      <input
        type="number"
        name="male"
        value={editForm.male}
        onChange={handleEditChange}
        style={{ marginBottom: 10, width: "100%", padding: "6px" }}
      />

      {/* Female */}
      <label style={{ fontWeight: "500" }}>Female</label>
      <input
        type="number"
        name="female"
        value={editForm.female}
        onChange={handleEditChange}
        style={{ marginBottom: 15, width: "100%", padding: "6px" }}
      />

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={handleSaveEdit}
          style={{
            padding: "6px 12px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
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



      {/* Filters (independent per chart) */}
     

      {/* Line Chart */}
      <div style={{ width: "100%", height: 600, marginTop: 8 }}>
        <canvas ref={lineRef}></canvas>
      </div>

      {/* Bar Chart Filter */}
      <div style={{ marginTop: 20 }}>
        <label>
          Bar Chart Range:
          <select value={filters.barRange} onChange={(e) => setFilters({ ...filters, barRange: e.target.value })} style={{ marginLeft: 8 }}>
            <option value="All">All</option>
            {yearRanges.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Grouped Bar Chart */}
      <div style={{ width: "100%", height: 600, marginTop: 12 }}>
        <canvas ref={barRef}></canvas>
      </div>

      {/* Population Pyramid */}
      <div style={{ width: "100%", height: "100%", marginTop: 30 }}>
        <canvas ref={pyramidRef}></canvas>
      </div>
    </div>
  );
};

export default SexDataset;

import React, { useState } from "react";
import AgeDataset from "./components/AgeDataset";
import AllCountriesDataset from "./components/AllCountriesDataset";
import CivilStatusDataset from "./components/CivilStatusDataset";
import EducationDataset from "./components/EducationDataset";
import OccupationDataset from "./components/OccupationDataset";
import OriginDataset from "./components/OriginDataset";
import SexDataset from "./components/SexDataset";

function App() {
  const [selectedDataset, setSelectedDataset] = useState("age");

  const datasets = [
    { id: "age", label: "Age", icon: "📊" },
    { id: "civilStatus", label: "Civil Status", icon: "💍" },
    { id: "destination", label: "Destination", icon: "🌍" },
    { id: "education", label: "Education", icon: "🎓" },
    { id: "occupation", label: "Occupation", icon: "💼" },
    { id: "origin", label: "Origin", icon: "📍" },
    { id: "sex", label: "Sex", icon: "👥" },
  ];

  const renderDataset = () => {
    switch (selectedDataset) {
      case "age":
        return <AgeDataset />;
      case "civilStatus":
        return <CivilStatusDataset />;
      case "destination":
        return <AllCountriesDataset />;
      case "education":
        return <EducationDataset />;
      case "occupation":
        return <OccupationDataset />;
      case "origin":
        return <OriginDataset />;
      case "sex":
        return <SexDataset />;
      default:
        return <AgeDataset />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* Sidebar Menu */}
      <div
        style={{
          width: "280px",
          background: "linear-gradient(180deg, #1e3a5f 0%, #2c5282 100%)",
          color: "#fff",
          padding: "0",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          boxShadow: "4px 0 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "32px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: "24px", 
            fontWeight: "700",
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 0%, #a0c4ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Dataset Explorer
          </h1>
          <p style={{ 
            margin: "8px 0 0", 
            fontSize: "13px", 
            color: "rgba(255,255,255,0.7)",
            fontWeight: "400"
          }}>
            Select a dataset to visualize
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: "16px 12px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent"
        }}>
          {datasets.map((dataset) => {
            const isActive = selectedDataset === dataset.id;
            return (
              <button
                key={dataset.id}
                onClick={() => setSelectedDataset(dataset.id)}
                style={{
                  width: "100%",
                  backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                  border: "none",
                  color: "white",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "15px",
                  fontWeight: isActive ? "600" : "500",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                  borderLeft: isActive ? "3px solid #60a5fa" : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                <span style={{ fontSize: "20px", opacity: isActive ? 1 : 0.8 }}>
                  {dataset.icon}
                </span>
                <span style={{ opacity: isActive ? 1 : 0.9 }}>{dataset.label}</span>
                {isActive && (
                  <span style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#60a5fa",
                    borderRadius: "50%",
                    boxShadow: "0 0 8px #60a5fa"
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ 
          padding: "20px 24px", 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: "12px",
          color: "rgba(255,255,255,0.6)",
          textAlign: "center"
        }}>
          <p style={{ margin: 0 }}>© 2025 Data Analytics</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: "32px 40px",
        overflowY: "auto",
        backgroundColor: "#f5f7fa"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {renderDataset()}
        </div>
      </div>
    </div>
  );
}

export default App;
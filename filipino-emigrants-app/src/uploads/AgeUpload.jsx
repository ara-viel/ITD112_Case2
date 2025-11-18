import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import Papa from "papaparse";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

const AgeDataset = () => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const ageCollection = collection(db, "ageDataset");

  const fetchData = async () => {
    const snapshot = await getDocs(ageCollection);
    const docs = snapshot.docs.map((doc) => doc.data());
    setData(docs);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CSV Upload handler (inline)
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage("Reading CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const existingSnapshot = await getDocs(ageCollection);
          const existingData = existingSnapshot.docs.map((doc) => doc.data());

          let added = 0;
          let skipped = 0;

          for (const row of results.data) {
            const ageGroup = row.ageGroup?.trim();
            if (!ageGroup) continue;

            const alreadyExists = existingData.some(
              (item) =>
                item.ageGroup?.toLowerCase() === ageGroup.toLowerCase()
            );

            if (alreadyExists) {
              skipped++;
              continue;
            }

            const cleanedRow = {};
            Object.entries(row).forEach(([key, value]) => {
              if (key === "ageGroup") cleanedRow[key] = ageGroup;
              else
                cleanedRow[key] = value
                  ? parseInt(value.toString().replace(/,/g, "").trim()) || 0
                  : 0;
            });

            await addDoc(ageCollection, cleanedRow);
            added++;
          }

          setMessage(
            `✅ Upload complete! Added ${added}, skipped ${skipped} duplicates.`
          );
          fetchData(); // 🔄 auto-refresh chart
        } catch (error) {
          console.error(error);
          setMessage("❌ Error uploading data.");
        } finally {
          setUploading(false);
        }
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-semibold">Age Dataset Overview</h2>

        {/* 📤 CSV Upload Button */}
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
          {uploading ? "Uploading..." : "Upload CSV"}
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {message && <p className="mb-4 text-sm">{message}</p>}

      {/* Your charts go here */}
      {data.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Horizontal Bar Chart</h3>
            <Bar
              data={{
                labels: data.map((d) => d.ageGroup),
                datasets: [
                  {
                    label: "Total Population (2020)",
                    data: data.map((d) => d["2020"]),
                    backgroundColor: "#60a5fa",
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Line Chart (Trend)</h3>
            <Line
              data={{
                labels: Object.keys(data[0]).filter((k) => k !== "ageGroup"),
                datasets: data.map((d) => ({
                  label: d.ageGroup,
                  data: Object.keys(d)
                    .filter((k) => k !== "ageGroup")
                    .map((year) => d[year]),
                  borderWidth: 2,
                  tension: 0.3,
                })),
              }}
              options={{ responsive: true }}
            />
          </div>
        </div>
      ) : (
        <p>No data available yet.</p>
      )}
    </div>
  );
};

export default AgeDataset;

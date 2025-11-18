import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const AllCountriesCSV = ({ collectionName = "destination" }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current.click();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("Reading file...");

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          const headers = results.meta.fields.map(f => f.trim().toLowerCase());

          // ✅ REQUIRED FIELDS CHECK
          const requiredYears = Array.from({ length: 40 }, (_, i) => (1981 + i).toString()); // 1981–2020
          const requiredFields = ["country", ...requiredYears];

          const missingFields = requiredFields.filter(f => !headers.includes(f));
          if (missingFields.length > 0) {
            setUploading(false);
            setMessage(`❌ Missing required columns: ${missingFields.join(", ")}`);
            return;
          }

          const collectionRef = collection(db, collectionName);
          const parseNum = val => val ? parseInt(val.toString().replace(/,/g, "").trim()) || 0 : 0;

          let validCount = 0;
          try {
            for (const row of rows) {
              if (!row.country) continue; // skip blank countries

              const cleanedRow = { country: row.country.trim() };

              // Add all years dynamically (1981–2020)
              for (let year = 1981; year <= 2020; year++) {
                cleanedRow[year] = parseNum(row[year]);
              }

              await addDoc(collectionRef, cleanedRow);
              validCount++;
            }

            setMessage(`✅ Uploaded ${validCount} valid records!`);
          } catch (error) {
            console.error("Error uploading data:", error);
            setMessage("❌ Upload failed. Check console for details.");
          }

          setUploading(false);
        },
      });
    } catch (error) {
      console.error("File read error:", error);
      setUploading(false);
      setMessage("❌ Error reading file.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      {message && (
        <span className={`text-sm whitespace-nowrap ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </span>
      )}
    </div>
  );
};

export default AllCountriesCSV;

import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";

const OriginCSV = ({ collectionName = "orig" }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("Reading file...");

    try {
      const text = await file.text();
      const hash = CryptoJS.MD5(text).toString();
      const storedHashes = JSON.parse(localStorage.getItem("uploadedHashes") || "[]");

      if (storedHashes.includes(hash)) {
        setUploading(false);
        setMessage("⚠️ This CSV file has already been uploaded!");
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          const headers = results.meta.fields.map((f) => f.trim().toLowerCase());

          // ✅ REQUIRED FIELDS CHECK
          const requiredFields = ["province", ...Array.from({ length: 33 }, (_, i) => (1988 + i).toString())];
          const missingFields = requiredFields.filter((field) => !headers.includes(field.toLowerCase()));

          if (missingFields.length > 0) {
            setUploading(false);
            setMessage(`❌ Missing required columns: ${missingFields.join(", ")}`);
            return;
          }

          const collectionRef = collection(db, collectionName);

          const parseNum = (val) =>
            val ? parseInt(val.toString().replace(/,/g, "").trim()) || 0 : 0;

          let validCount = 0;

          try {
            for (const row of rows) {
              if (!row.province && !row.Province && !row.PROVINCE) continue; // skip blank provinces

              const cleanedRow = {
                province:
                  row.province ||
                  row["Province"] ||
                  row["PROVINCE"] ||
                  "Unknown",
              };

              // Add all years dynamically (1988–2020)
              for (let year = 198; year <= 2020; year++) {
                cleanedRow[year] = parseNum(row[year]);
              }

              await addDoc(collectionRef, cleanedRow);
              validCount++;
            }

            storedHashes.push(hash);
            localStorage.setItem("uploadedHashes", JSON.stringify(storedHashes));

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
        <span
          className={`text-sm whitespace-nowrap ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default OriginCSV;

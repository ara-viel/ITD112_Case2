import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";

const AgeCSV = ({ collectionName = "age" }) => {
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
      const text = await file.text();
      const hash = CryptoJS.MD5(text).toString();
      const storedHashes = JSON.parse(localStorage.getItem("uploadedHashes") || "[]");

      if (storedHashes.includes(hash)) {
        const confirmReupload = window.confirm(
          "⚠️ The same file is being uploaded. Do you want to merge the data with existing records?"
        );
        if (!confirmReupload) {
          setUploading(false);
          setMessage("Upload cancelled by user.");
          return;
        }
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          const headers = results.meta.fields || [];

          // Validation
          const hasAgeGroup = headers.some(h => ["agegroup", "age group", "age_group"].includes(h.toLowerCase().trim()));
          if (!hasAgeGroup) {
            setUploading(false);
            setMessage("❌ CSV must include an 'Age Group' column.");
            return;
          }

          const yearColumns = [];
          for (let year = 1981; year <= 2020; year++) if (headers.includes(year.toString())) yearColumns.push(year);

          if (yearColumns.length !== 40) {
            setUploading(false);
            setMessage("❌ CSV must have all year columns from 1981–2020.");
            return;
          }

          const uniqueAgeGroups = new Set(rows.map(r => r.ageGroup || r["Age Group"] || r["AGE GROUP"] || "Unknown"));
          if (uniqueAgeGroups.size !== 14) {
            setUploading(false);
            setMessage("❌ CSV must contain exactly 14 unique age groups.");
            return;
          }

          const collectionRef = collection(db, collectionName);
          const parseNum = (val) => (val ? parseInt(val.toString().replace(/,/g, "").trim()) || 0 : 0);

          try {
            for (const row of rows) {
              const ageGroup = row.ageGroup || row["Age Group"] || row["AGE GROUP"] || row["age group"] || "Unknown";
              const yearData = {};
              for (let year = 1981; year <= 2020; year++) yearData[year] = parseNum(row[year]);

              // Check if this ageGroup already exists
              const q = query(collectionRef, where("ageGroup", "==", ageGroup));
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Merge: add year values to existing document
                const existingDoc = snapshot.docs[0];
                const updatedData = { ...existingDoc.data() };
                for (let year = 1981; year <= 2020; year++) {
                  updatedData[year] = (updatedData[year] || 0) + yearData[year];
                }
                await updateDoc(doc(db, collectionName, existingDoc.id), updatedData);
              } else {
                // Add new document
                await addDoc(collectionRef, { ageGroup, ...yearData });
              }
            }

            if (!storedHashes.includes(hash)) {
              storedHashes.push(hash);
              localStorage.setItem("uploadedHashes", JSON.stringify(storedHashes));
            }

            setMessage(`✅ Successfully uploaded and merged ${rows.length} records!`);
          } catch (error) {
            console.error("Error uploading data:", error);
            setMessage("❌ Upload failed. Check console for details.");
          } finally {
            setUploading(false);
          }
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
      <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} style={{ display: "none" }} />
      <button onClick={handleClick} disabled={uploading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>
      {message && <span className="text-green-700 text-sm whitespace-nowrap">{message}</span>}
    </div>
  );
};

export default AgeCSV;

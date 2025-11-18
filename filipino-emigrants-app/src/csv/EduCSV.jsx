import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import CryptoJS from "crypto-js"; // 🧩 Import hashing library

const EduCSV = ({ collectionName = "education" }) => {
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
      // 🧩 Step 1: Read file content as text
      const text = await file.text();

      // 🧩 Step 2: Compute a unique hash of file contents
      const hash = CryptoJS.MD5(text).toString();

      // 🧩 Step 3: Retrieve previously uploaded hashes
      const storedHashes = JSON.parse(localStorage.getItem("uploadedHashes") || "[]");

      // 🧩 Step 4: Check for duplicate uploads
      if (storedHashes.includes(hash)) {
        const confirmReupload = window.confirm(
          "⚠️ The same file is being uploaded. Do you want to continue?"
        );
        if (!confirmReupload) {
          setUploading(false);
          setMessage("Upload cancelled by user.");
          return;
        }
      }

      // 🧩 Step 5: Parse CSV and upload data
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          const collectionRef = collection(db, collectionName);

          const parseNum = (val) =>
            val ? parseInt(val.toString().replace(/,/g, "").trim()) || 0 : 0;

          try {
            for (const row of rows) {
              const cleanedRow = {
                eduAttainment:
                  row.eduAttainment ||
                  row["Educational Attainment"] ||
                  row["EDUCATIONAL ATTAINMENT"] ||
                  "Unknown",
              };

              // Add years 1981–2020 dynamically
              for (let year = 1988; year <= 2020; year++) {
                cleanedRow[year] = parseNum(row[year]);
              }

              await addDoc(collectionRef, cleanedRow);
            }

            // 🧩 Step 6: Save hash so it can’t re-upload
            storedHashes.push(hash);
            localStorage.setItem("uploadedHashes", JSON.stringify(storedHashes));

            setMessage(`✅ Successfully uploaded ${rows.length} records!`);
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
      {/* Hidden input */}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      {/* Upload Button */}
      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      {/* Upload Status */}
      {message && (
        <span className="text-green-600 text-sm whitespace-nowrap">
          {message}
        </span>
      )}
    </div>
  );
};

export default EduCSV;

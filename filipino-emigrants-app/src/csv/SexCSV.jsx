import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import CryptoJS from "crypto-js"; // for duplicate check

const SexCSV = ({ collectionName = "sex" }) => {
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
      // Step 1: Read file content
      const text = await file.text();

      // Step 2: Create file hash
      const hash = CryptoJS.MD5(text).toString();

      // Step 3: Retrieve uploaded hashes from local storage
      const storedHashes = JSON.parse(localStorage.getItem("uploadedHashes") || "[]");

      // Step 4: Prevent duplicate upload
      if (storedHashes.includes(hash)) {
        setUploading(false);
        setMessage("⚠️ This CSV file has already been uploaded!");
        return;
      }

      // Step 5: Parse CSV
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
                year: parseInt(row.year || row.YEAR || 0),
                male: parseNum(row.male || row.Male || row.MALE),
                female: parseNum(row.female || row.Female || row.FEMALE),
              };

              // Only upload valid rows (skip empty or invalid years)
              if (cleanedRow.year && (cleanedRow.male || cleanedRow.female)) {
                await addDoc(collectionRef, cleanedRow);
              }
            }

            // Step 6: Save hash to prevent re-upload
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
        <span
          className={`text-sm whitespace-nowrap ${
            message.startsWith("✅")
              ? "text-green-600"
              : message.startsWith("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
};

export default SexCSV;

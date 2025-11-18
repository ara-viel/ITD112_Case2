import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const CSVUpload = ({ collectionName = "civilStatus" }) => {
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
              year: parseInt(row.YEAR || row.year || 0),
              single: parseNum(row.Single || row.single),
              married: parseNum(row.Married || row.married),
              widower: parseNum(row.Widower || row.widower),
              separated: parseNum(row.Separated || row.separated),
              divorced: parseNum(row.Divorced || row.divorced),
              notReported: parseNum(
                row["Not Reported"] ||
                  row.notReported ||
                  row["Not reported"] ||
                  row["Not_Reported"]
              ),
            };
            await addDoc(collectionRef, cleanedRow);
          }
          setMessage(`✅ Successfully uploaded ${rows.length} records!`);
        } catch (error) {
          console.error("Error uploading data:", error);
          setMessage("❌ Upload failed. Check console for details.");
        }
        setUploading(false);
      },
    });
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

      {/* Custom button */}
      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"

      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      {/* Optional message beside the button */}
      {message && (
        <span className="text-green-600 text-sm whitespace-nowrap">
          {message}
        </span>
      )}
    </div>
  );
};

export default CSVUpload;

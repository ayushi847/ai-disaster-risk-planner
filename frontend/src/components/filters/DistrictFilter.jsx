import React from "react";

const DistrictFilter = ({
  value = "ALL",
  onChange,
  villages = [],
}) => {
  // -----------------------------------
  // 1. Debug: villages ka data check karo
  // -----------------------------------
  console.log("DistrictFilter rendered");
  console.log("villages:", villages);
  console.log("villages isArray:", Array.isArray(villages));

  // -----------------------------------
  // 2. Safety check
  // -----------------------------------
  const safeVillages = Array.isArray(villages)
    ? villages
    : [];

  // -----------------------------------
  // 3. Districts nikalo
  // -----------------------------------
  const districts = [
    ...new Set(
      safeVillages
        .map((village) => village?.district)
        .filter(
          (district) =>
            district !== undefined &&
            district !== null &&
            String(district).trim() !== ""
        )
        .map((district) => String(district).trim())
    ),
  ].sort();

  // -----------------------------------
  // 4. Debug: districts check karo
  // -----------------------------------
  console.log("Districts:", districts);

  // -----------------------------------
  // 5. Render
  // -----------------------------------
  return (
    <div style={{ marginBottom: "20px" }}>
      <label>
        <strong>District</strong>
      </label>

      <select
        value={value || "ALL"}
        onChange={(e) => {
          console.log("Selected district:", e.target.value);

          if (onChange) {
            onChange(e.target.value);
          }
        }}
        style={{
          width: "100%",
          padding: "8px",
          marginTop: "8px",
        }}
      >
        <option value="ALL">
          All Districts
        </option>

        {districts.map((district) => (
          <option
            key={district}
            value={district}
          >
            {district}
          </option>
        ))}
      </select>

      {/* Debug information */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        Villages: {safeVillages.length} | Districts:{" "}
        {districts.length}
      </div>
    </div>
  );
};

export default DistrictFilter;

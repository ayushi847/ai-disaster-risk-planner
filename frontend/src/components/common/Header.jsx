const Header = () => {
  return (
    <header
      style={{
        height: "70px",
        background:
          "linear-gradient(90deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
      }}
    >

      {/* ================= LEFT BRAND ================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >

        {/* SIH / AUTHORITY LOGO */}

        <div
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            fontSize:"25px",
            boxShadow:
              "0 0 18px rgba(59,130,246,0.6)",
          }}
        >
          🛡️
        </div>


        {/* TITLE */}

        <div>

          <div
            style={{
              fontSize:"18px",
              fontWeight:"800",
              letterSpacing:"0.3px",
              display:"flex",
              alignItems:"center",
              gap:"8px"
            }}
          >

            AI Disaster Risk Assessment 
            <span style={{color:"#60a5fa"}}>
              &
            </span>
            Relocation Platform

          </div>



          <div
            style={{
              marginTop:"3px",
              fontSize:"11px",
              color:"#94a3b8",
              fontWeight:"500",
            }}
          >

            SIH26191 • Intelligent Identification of Hazard-Based Red Zones,
            Carrying Capacity Assessment & Immediate Relocation Planning

          </div>


        </div>


      </div>





      {/* ================= STATUS SECTION ================= */}


      <div
        style={{
          display:"flex",
          alignItems:"center",
          gap:"10px"
        }}
      >


        {/* ML ENGINE */}

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:"6px",
            padding:"5px 12px",
            borderRadius:"20px",
            background:"rgba(16,185,129,0.15)",
            border:"1px solid rgba(16,185,129,0.3)",
            color:"#34d399",
            fontSize:"11px",
            fontWeight:"600"
          }}
        >

          <span
            style={{
              width:"7px",
              height:"7px",
              borderRadius:"50%",
              background:"#10b981"
            }}
          />

          AI Risk Engine Active

        </div>





        {/* POSTGIS */}

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:"6px",
            padding:"5px 12px",
            borderRadius:"20px",
            background:"rgba(59,130,246,0.15)",
            border:
            "1px solid rgba(59,130,246,0.3)",
            color:"#60a5fa",
            fontSize:"11px",
            fontWeight:"600"
          }}
        >

          <span
            style={{
              width:"7px",
              height:"7px",
              borderRadius:"50%",
              background:"#3b82f6"
            }}
          />

          PostGIS 71 Habitations

        </div>





        {/* CRITICAL */}

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:"6px",
            padding:"5px 12px",
            borderRadius:"20px",
            background:"rgba(239,68,68,0.15)",
            border:
            "1px solid rgba(239,68,68,0.3)",
            color:"#f87171",
            fontSize:"11px",
            fontWeight:"600"
          }}
        >

          <span
            style={{
              width:"7px",
              height:"7px",
              borderRadius:"50%",
              background:"#ef4444"
            }}
          />

          17 Critical Zones

        </div>





        {/* ADMIN BUTTON */}


        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"

          style={{
            display:"flex",
            alignItems:"center",
            gap:"7px",
            background:
            "linear-gradient(135deg,#4f46e5,#7c3aed)",
            padding:"7px 14px",
            borderRadius:"9px",
            color:"white",
            textDecoration:"none",
            fontSize:"12px",
            fontWeight:"700",
            boxShadow:
            "0 4px 12px rgba(124,58,237,0.4)"
          }}

        >

          ⚖️ Authority Portal ↗

        </a>


      </div>


    </header>
  );
};


export default Header;
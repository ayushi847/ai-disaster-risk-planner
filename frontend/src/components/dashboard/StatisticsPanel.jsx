import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


const StatisticsPanel = ({ villages = [] }) => {


  // ============================
  // LIVE RISK DATA
  // ============================

  const riskData = [

    {
      name: "Critical",
      value: villages.filter(
        v => v.riskLevel === "CRITICAL"
      ).length,
      color: "#dc2626"
    },


    {
      name: "High",
      value: villages.filter(
        v => v.riskLevel === "HIGH"
      ).length,
      color: "#ea580c"
    },


    {
      name: "Medium",
      value: villages.filter(
        v => v.riskLevel === "MEDIUM"
      ).length,
      color: "#ca8a04"
    },


    {
      name: "Low",
      value: villages.filter(
        v => v.riskLevel === "LOW"
      ).length,
      color: "#16a34a"
    }

  ].filter(
    item => item.value > 0
  );




  // ============================
  // LIVE HAZARD DATA
  // ============================


  const hazardData = [

    {
      name:"Flood",

      value:villages.filter(
        v => v.hazardType === "Flood"
      ).length,

      color:"#2563eb"
    },


    {
      name:"Landslide",

      value:villages.filter(
        v => v.hazardType === "Landslide"
      ).length,

      color:"#92400e"
    }


  ].filter(
    item => item.value > 0
  );




  return (

    <div

      style={{

        display:"grid",

        gridTemplateColumns:"1fr 1fr",

        gap:"16px",

        marginBottom:"15px"

      }}

    >



      <ChartCard

        title="Risk Distribution"

        data={riskData}

        total={villages.length}

      />



      <ChartCard

        title="Hazard Distribution"

        data={hazardData}

        total={villages.length}

      />



    </div>

  );

};






// =================================
// CHART CARD COMPONENT
// =================================


const ChartCard = ({
  title,
  data,
  total
}) => {


  return (

    <div

      style={{

        background:"#ffffff",

        border:"1px solid #e2e8f0",

        borderRadius:"16px",

        padding:"16px",

        height:"320px",

        display:"flex",

        flexDirection:"column",

        boxShadow:
        "0 4px 12px rgba(15,23,42,0.06)"

      }}

    >



      <h3

        style={{

          margin:"0 0 5px",

          fontSize:"16px",

          fontWeight:700,

          color:"#0f172a"

        }}

      >

        {title}

      </h3>





      <div

        style={{

          flex:1,

          position:"relative"

        }}

      >



      <ResponsiveContainer

        width="100%"

        height="100%"

      >


      <PieChart>


        <Pie


          data={data}


          dataKey="value"


          nameKey="name"


          cx="50%"


          cy="50%"


          innerRadius={65}


          outerRadius={95}


          startAngle={90}


          endAngle={-270}


          paddingAngle={2}


          stroke="none"


        >



        {

          data.map(

            (entry,index)=>(


              <Cell

                key={index}

                fill={entry.color}

              />


            )

          )

        }



        </Pie>



        <Tooltip />


      </PieChart>



      </ResponsiveContainer>






      {/* CENTER TEXT */}


      <div

        style={{

          position:"absolute",

          top:"50%",

          left:"50%",

          transform:
          "translate(-50%,-50%)",

          textAlign:"center"

        }}

      >


        <div

          style={{

            fontSize:"28px",

            fontWeight:800,

            color:"#0f172a"

          }}

        >

          {total}

        </div>



        <div

          style={{

            fontSize:"12px",

            color:"#64748b"

          }}

        >

          Total

        </div>



      </div>



      </div>





      {/* LEGEND */}



      <div

        style={{

          display:"flex",

          justifyContent:"center",

          gap:"14px",

          flexWrap:"wrap",

          marginTop:"8px"

        }}

      >



      {

        data.map(item=>(


          <div

            key={item.name}

            style={{

              display:"flex",

              alignItems:"center",

              gap:"5px",

              fontSize:"12px",

              color:"#475569"

            }}

          >


            <span

              style={{

                width:"10px",

                height:"10px",

                borderRadius:"50%",

                background:item.color

              }}

            />


            {item.name}


            <b>

              ({item.value})

            </b>



          </div>


        ))

      }



      </div>



    </div>


  );

};




export default StatisticsPanel;




import { useEffect, useState } from "react";

import {
  getVillages,
  getRelocationSites,
} from "../services/api";


const RelocationPlanner = () => {

  const [villages, setVillages] = useState([]);
  const [sites, setSites] = useState([]);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const loadData = async () => {

      try {

        const villageData = await getVillages();
        const siteData = await getRelocationSites();


        if(villageData){
          setVillages(villageData);
        }


        if(siteData){
          setSites(siteData);
        }


      } catch(error){

        console.error(
          "Relocation data error:",
          error
        );

      }
      finally{
        setLoading(false);
      }

    };


    loadData();

  },[]);



  const criticalVillages =
    villages.filter(
      v =>
      v.riskLevel === "CRITICAL"
    );


  const immediateMove =
    villages.filter(
      v =>
      v.priority === "IMMEDIATE"
    );


  const totalCapacity =
    sites.reduce(
      (sum,s)=>
      sum + (s.capacity || 0),
      0
    );


  const occupied =
    sites.reduce(
      (sum,s)=>
      sum + (s.currentOccupancy || 0),
      0
    );


  const availability =
    totalCapacity ?
    Math.round(
      ((totalCapacity-occupied)
      /totalCapacity)*100
    )
    :
    0;



return (

<div
style={{
height:"100%",
display:"flex",
flexDirection:"column",
gap:"18px"
}}
>


{/* HEADER */}

<div
style={{
background:"#fff",
padding:"22px 26px",
borderRadius:"18px",
border:"1px solid #e2e8f0",
boxShadow:"0 3px 12px rgba(0,0,0,.05)"
}}
>


<h1
style={{
margin:0,
fontSize:"30px",
fontWeight:800,
color:"#0f172a"
}}
>
🏠 Relocation Planner
</h1>


<p
style={{
marginTop:"8px",
color:"#64748b",
fontSize:"15px"
}}
>
AI assisted evacuation planning,
temporary shelters and vulnerable
habitation relocation monitoring.
</p>


</div>




{/* SUMMARY CARDS */}


<div
style={{
display:"grid",
gridTemplateColumns:
"repeat(4,1fr)",
gap:"16px"
}}
>


<Card
title="Critical Villages"
value={criticalVillages.length}
icon="🚨"
color="#fee2e2"
/>


<Card
title="Immediate Relocation"
value={immediateMove.length}
icon="🚚"
color="#fef3c7"
/>


<Card
title="Shelter Capacity"
value={`${totalCapacity}`}
icon="🏕️"
color="#dcfce7"
/>


<Card
title="Available Space"
value={`${availability}%`}
icon="✅"
color="#dbeafe"
/>


</div>





{/* MAIN GRID */}

<div
style={{
display:"grid",
gridTemplateColumns:"1.2fr 1fr",
gap:"18px",
flex:1
}}
>



{/* VILLAGE PRIORITY TABLE */}


<div
style={{
background:"#fff",
borderRadius:"18px",
border:"1px solid #e2e8f0",
padding:"20px",
overflow:"auto"
}}
>


<h2
style={{
marginTop:0,
fontSize:"20px"
}}
>
🚨 Relocation Priority List
</h2>


{
loading ?

<p>
Loading live data...
</p>


:

criticalVillages.length===0 ?

<p>
No critical villages found
</p>


:

criticalVillages.map((v)=>(


<div
key={v.id}
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"14px",
marginBottom:"10px",
background:"#f8fafc",
borderRadius:"12px"
}}
>


<div>

<b>
{v.name}
</b>

<div
style={{
fontSize:"13px",
color:"#64748b"
}}
>
{v.district}
</div>

</div>



<span
style={{
background:"#dc2626",
color:"#fff",
padding:"5px 12px",
borderRadius:"20px",
fontSize:"12px",
fontWeight:700
}}
>
{v.priority || "HIGH"}
</span>


</div>


))

}



</div>






{/* SHELTER PANEL */}


<div
style={{
background:"#fff",
borderRadius:"18px",
border:"1px solid #e2e8f0",
padding:"20px",
overflow:"auto"
}}
>


<h2
style={{
marginTop:0
}}
>
🏕️ Relocation Centers
</h2>


{
sites.map(site=>(


<div
key={site.id}
style={{
padding:"15px",
marginBottom:"12px",
background:"#f8fafc",
borderRadius:"12px"
}}
>


<div
style={{
display:"flex",
justifyContent:"space-between"
}}
>

<b>
{site.name}
</b>


<span
style={{
color:
site.currentOccupancy >
site.capacity*.8
?
"#dc2626"
:
"#16a34a"
}}
>
{
site.currentOccupancy
}/
{
site.capacity
}
</span>


</div>


<p
style={{
margin:"6px 0",
color:"#64748b"
}}
>
📍 {site.location || "India"}
</p>


<div
style={{
height:"8px",
background:"#e2e8f0",
borderRadius:"10px"
}}
>

<div
style={{
width:
`${Math.min(
(site.currentOccupancy/site.capacity)*100,
100
)}%`,
height:"100%",
background:"#2563eb",
borderRadius:"10px"
}}
/>


</div>


</div>


))

}


</div>


</div>


</div>


);

};



const Card = ({
title,
value,
icon,
color
})=>{


return (

<div
style={{
background:"#fff",
padding:"18px",
borderRadius:"16px",
border:"1px solid #e2e8f0",
display:"flex",
alignItems:"center",
gap:"15px"
}}
>


<div
style={{
height:"45px",
width:"45px",
borderRadius:"12px",
background:color,
display:"flex",
alignItems:"center",
justifyContent:"center",
fontSize:"22px"
}}
>
{icon}
</div>


<div>

<p
style={{
margin:0,
color:"#64748b",
fontSize:"13px"
}}
>
{title}
</p>


<h2
style={{
margin:"5px 0 0",
fontSize:"24px"
}}
>
{value}
</h2>


</div>


</div>

)

}



export default RelocationPlanner;
import { useEffect, useState } from "react";

import {
  getVillages,
  getHazardZones,
} from "../../services/api";


const Icon = ({ emoji, color }) => (
  <div
    style={{
      width: "42px",
      height: "42px",
      borderRadius: "12px",
      background: `${color}18`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
    }}
  >
    {emoji}
  </div>
);



const SummaryCards = () => {


const [summary,setSummary] = useState({

  villages:0,
  critical:0,
  hazards:0,
  relocation:0,
  population:0,
  confidence:"94%"

});



const loadSummary = async()=>{

try{


const [
 villages,
 hazards
]=await Promise.all([

 getVillages(),
 getHazardZones()

]);



const data = Array.isArray(villages)
? villages
: [];




const riskLevel=(v)=>
String(
 v?.riskLevel ||
 v?.risk_level ||
 v?.risk ||
 ""
).toUpperCase();




const priority=(v)=>
String(
 v?.priority ||
 v?.priorityLevel ||
 v?.relocationPriority ||
 v?.relocation_priority ||
 ""
).toUpperCase();





const critical = data.filter(
(v)=>
riskLevel(v)==="CRITICAL"
).length;





const immediate = data.filter(
(v)=>
priority(v)==="IMMEDIATE"
).length;





const population = data.reduce(
(sum,v)=>
sum+
Number(
v?.population ||
v?.populationAtRisk ||
0
),
0
);





setSummary({

 villages:data.length,

 critical,

 hazards:Array.isArray(hazards)
 ? hazards.length
 : 0,

 relocation:immediate,

 population,

 confidence:"AI Model Active"

});



}
catch(err){

console.error(
"Summary loading error",
err
);

}

};





useEffect(()=>{

loadSummary();


const interval=setInterval(()=>{

loadSummary();

},30000);



return ()=>clearInterval(interval);


},[]);







const cards=[

{
title:"Total Villages",
value:summary.villages,
emoji:"🏘️",
color:"#2563eb"
},


{
title:"Critical Villages",
value:summary.critical,
emoji:"🚨",
color:"#dc2626"
},


{
title:"Active Hazards",
value:summary.hazards,
emoji:"🌋",
color:"#7c3aed"
},


{
title:"Immediate Relocation",
value:summary.relocation,
emoji:"🚑",
color:"#ea580c"
},


{
title:"Population At Risk",
value:
summary.population.toLocaleString("en-IN"),
emoji:"👥",
color:"#4f46e5"
},


{
title:"AI Confidence",
value:summary.confidence,
emoji:"🤖",
color:"#059669"
}


];






return (

<div

style={{

display:"grid",

gridTemplateColumns:
"repeat(6,minmax(140px,1fr))",

gap:"14px",

marginBottom:"18px"

}}

>


{

cards.map(card=>(


<div

key={card.title}

style={{

background:"#fff",

border:"1px solid #e2e8f0",

borderRadius:"16px",

padding:"16px",

boxShadow:
"0 4px 14px rgba(15,23,42,0.06)"

}}

>



<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center"

}}

>


<span

style={{

fontSize:"12px",

fontWeight:"700",

color:"#64748b"

}}

>

{card.title}

</span>


<Icon

emoji={card.emoji}

color={card.color}

/>


</div>




<div

style={{

marginTop:"14px",

fontSize:"28px",

fontWeight:"800",

color:"#0f172a"

}}

>

{card.value}

</div>




<div

style={{

marginTop:"8px",

fontSize:"11px",

color:"#16a34a",

fontWeight:"700"

}}

>

● LIVE FROM RISK ENGINE

</div>



</div>


))


}


</div>


);


};


export default SummaryCards;
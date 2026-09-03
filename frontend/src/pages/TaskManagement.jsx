


import { useEffect, useState } from "react";

const TaskManagement = () => {

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Flood Evacuation - Assam Basin",
      category: "Emergency",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      assigned: "Rescue Team Alpha",
      progress: 65,
      deadline: "Today 18:00",
    },
    {
      id: 2,
      title: "Relocation Site Verification",
      category: "Planning",
      priority: "HIGH",
      status: "PENDING",
      assigned: "Field Survey Team",
      progress: 30,
      deadline: "Tomorrow",
    },
    {
      id: 3,
      title: "Landslide Risk Assessment",
      category: "Risk Analysis",
      priority: "MEDIUM",
      status: "COMPLETED",
      assigned: "GIS Team",
      progress: 100,
      deadline: "Completed",
    },
  ]);


  const [filter,setFilter] = useState("ALL");


  // Future backend integration
  useEffect(()=>{

    const fetchTasks = async()=>{

      try{

        const res = await fetch(
          "http://localhost:8080/api/tasks"
        );

        if(res.ok){

          const data = await res.json();

          if(data.length){
            setTasks(data);
          }

        }

      }
      catch(err){
        console.log(
          "Task API unavailable using demo data"
        );
      }

    };


    fetchTasks();

  },[]);



  const filteredTasks =
    filter==="ALL"
    ? tasks
    :
    tasks.filter(
      t=>t.status===filter
    );



  const stats=[
    {
      title:"Total Tasks",
      value:tasks.length,
      icon:"📋"
    },
    {
      title:"Critical Tasks",
      value:
      tasks.filter(
        t=>t.priority==="CRITICAL"
      ).length,
      icon:"🚨"
    },
    {
      title:"In Progress",
      value:
      tasks.filter(
        t=>t.status==="IN_PROGRESS"
      ).length,
      icon:"⚡"
    },
    {
      title:"Completed",
      value:
      tasks.filter(
        t=>t.status==="COMPLETED"
      ).length,
      icon:"✅"
    }
  ];



return (

<div
style={{
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
borderRadius:"16px",
border:"1px solid #e2e8f0",
boxShadow:"0 4px 12px rgba(0,0,0,.05)"
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
📝 Disaster Task Management
</h1>


<p
style={{
marginTop:"8px",
color:"#64748b"
}}
>
Manage emergency operations, rescue activities and field response tasks.
</p>


</div>




{/* STATS */}

<div
style={{
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:"16px"
}}
>

{
stats.map((s,i)=>(

<div
key={i}
style={{
background:"#fff",
padding:"18px",
borderRadius:"14px",
border:"1px solid #e2e8f0",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<div>

<p
style={{
margin:0,
fontSize:"13px",
color:"#64748b"
}}
>
{s.title}
</p>


<h2
style={{
margin:"6px 0",
fontSize:"28px"
}}
>
{s.value}
</h2>

</div>


<div
style={{
fontSize:"30px"
}}
>
{s.icon}
</div>


</div>

))
}


</div>





{/* FILTERS */}

<div
style={{
display:"flex",
gap:"10px"
}}
>

{
[
"ALL",
"PENDING",
"IN_PROGRESS",
"COMPLETED"
]
.map(status=>(


<button
key={status}
onClick={()=>setFilter(status)}
style={{

padding:"9px 16px",

borderRadius:"8px",

border:"1px solid #cbd5e1",

background:
filter===status
?
"#2563eb"
:
"#fff",

color:
filter===status
?
"#fff"
:
"#475569",

fontWeight:600,

cursor:"pointer"

}}
>

{status.replace("_"," ")}

</button>


))
}


</div>





{/* TASK TABLE */}

<div
style={{
background:"#fff",
borderRadius:"16px",
border:"1px solid #e2e8f0",
overflow:"hidden"
}}
>


<table
style={{
width:"100%",
borderCollapse:"collapse"
}}
>

<thead>

<tr
style={{
background:"#f8fafc",
textAlign:"left"
}}
>

<th style={{padding:"14px"}}>
Task
</th>

<th>
Category
</th>

<th>
Priority
</th>

<th>
Assigned Team
</th>

<th>
Progress
</th>

<th>
Status
</th>

</tr>

</thead>



<tbody>


{
filteredTasks.map(task=>(


<tr
key={task.id}
style={{
borderTop:"1px solid #e2e8f0"
}}
>


<td
style={{
padding:"16px",
fontWeight:600
}}
>

{task.title}

<div
style={{
fontSize:"12px",
color:"#64748b",
marginTop:"4px"
}}
>
Deadline: {task.deadline}
</div>

</td>



<td>
{task.category}
</td>



<td>

<span
style={{

padding:"5px 10px",

borderRadius:"20px",

fontSize:"12px",

fontWeight:700,


background:
task.priority==="CRITICAL"
?
"#fee2e2"
:
task.priority==="HIGH"
?
"#fef3c7"
:
"#dcfce7",

color:
task.priority==="CRITICAL"
?
"#dc2626"
:
task.priority==="HIGH"
?
"#d97706"
:
"#16a34a"

}}
>

{task.priority}

</span>

</td>




<td>
{task.assigned}
</td>



<td>

<div
style={{
width:"120px",
height:"8px",
background:"#e2e8f0",
borderRadius:"10px"
}}
>

<div
style={{
width:`${task.progress}%`,
height:"100%",
background:"#2563eb",
borderRadius:"10px"
}}
>

</div>


</div>


<span
style={{
fontSize:"12px"
}}
>
{task.progress}%
</span>


</td>




<td>

<span
style={{

padding:"6px 12px",

borderRadius:"20px",

fontSize:"12px",

fontWeight:700,


background:
task.status==="COMPLETED"
?
"#dcfce7"
:
task.status==="IN_PROGRESS"
?
"#dbeafe"
:
"#fef3c7"

}}

>

{task.status}

</span>

</td>



</tr>


))
}


</tbody>


</table>


</div>



</div>

);


};


export default TaskManagement;
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <>
      <Header />

      <div
        style={{
          display: "flex",
          height: "calc(100vh - 72px)",
          background: "#f1f5f9",
          overflow: "hidden",
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            background: "#f8fafc",
          }}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
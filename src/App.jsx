import React from "react";
import "./index.css";
import Home from "./page/Home";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import UserDashboard from "./page/UserDashboard";
import CoordinatorDashboardUI from "./page/CoordinatorDashboardUI";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <UserDashboard />,
  },
  ,
  {
    path: "/coordinator",
    element: <CoordinatorDashboardUI />,
  },
]);

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <RouterProvider router={router} />
    </div>
  );
}

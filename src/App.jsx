import React from "react";
import "./index.css";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";

import Home from "./page/Home";
import UserDashboard from "./page/UserDashboard";
import CoordinatorDashboardUI from "./page/CoordinatorDashboardUI";
import MentorDashboard from "./page/MentorDashboard";
import JudgeDashboard from "./page/JudgeDashboard";

// ---- Trang lỗi ----
const Pending = () => (
  <div className="text-white p-10">Tài khoản đang chờ duyệt.</div>
);
const Rejected = () => (
  <div className="text-white p-10">Tài khoản bị từ chối.</div>
);
const NotFound = () => (
  <div className="text-white p-10">404 - Không tìm thấy trang.</div>
);
const Forbidden = () => (
  <div className="text-white p-10">403 - Không có quyền truy cập.</div>
);

// ---- Protected Route ----
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (user?.systemRole === "Pending") return <Navigate to="/pending" replace />;
  if (user?.systemRole === "Rejected")
    return <Navigate to="/rejected" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.systemRole))
    return <Navigate to="/403" replace />;

  return children;
}

// ---- Routes ----
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/pending", element: <Pending /> },
  { path: "/rejected", element: <Rejected /> },
  { path: "/403", element: <Forbidden /> },
  { path: "*", element: <NotFound /> },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Leader"]}>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Coordinator"]}>
        <CoordinatorDashboardUI />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mentor/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Mentor"]}>
        <MentorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/judge/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["Judge"]}>
        <JudgeDashboard />
      </ProtectedRoute>
    ),
  },
]);

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <RouterProvider router={router} />
    </div>
  );
}

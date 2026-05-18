import React from "react";
import "./index.css";
import Home from "./page/Home";
import Testing from "./page/Testing";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/testing",
    element: <Testing />,
  },
]);

export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <RouterProvider router={router} />
    </div>
  );
}

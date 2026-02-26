import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import VendorDashboardLayout from "@/pages/vendor/VendorDashboardLayout";
import VendorProfilePage from "@/pages/vendor/VendorProfilePage";
import StudentLayout from "@/pages/student/StudentLayout";
import StudentDiscoveryPage from "@/pages/student/StudentDiscoveryPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { VendorRoute } from "@/components/VendorRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/vendor",
    element: (
      <VendorRoute>
        <VendorDashboardLayout />
      </VendorRoute>
    ),
    children: [
      { index: true, element: <VendorProfilePage /> },
      { path: "profile", element: <VendorProfilePage /> },
    ],
  },
  {
    path: "/student",
    element: <StudentLayout />,
    children: [
      { index: true, element: <StudentDiscoveryPage /> },
      { path: "discover", element: <StudentDiscoveryPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

import { Outlet } from "react-router-dom";
import { StudentRoute } from "@/components/StudentRoute";

export default function StudentLayout() {
  return (
    <StudentRoute>
      <Outlet />
    </StudentRoute>
  );
}

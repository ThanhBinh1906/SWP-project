import { Layers } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutSuccess } from "../../store/authSlice";
import authService from "../../services/authService";
import { RoleSidebar } from "../shared/RoleSidebar";
import { icons } from "./CoordinatorUI";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    labelVi: "Tổng quan",
    icon: icons.LayoutDashboard,
  },
  {
    id: "competition-setup",
    label: "Competition Setup",
    labelVi: "Cài đặt thi đấu",
    icon: Layers,
  },
  {
    id: "criteria",
    label: "Criteria",
    labelVi: "Tiêu chí",
    icon: icons.SlidersHorizontal,
  },
  { id: "topics", label: "Topics", labelVi: "Đề tài", icon: icons.Lightbulb },
  { id: "accounts", label: "Accounts", labelVi: "Tài khoản", icon: icons.Users },
  { id: "teams", label: "Teams", labelVi: "Đội thi", icon: icons.UserRoundCog },
  { id: "results", label: "Results", labelVi: "Kết quả", icon: icons.Trophy },
  { id: "audit", label: "Audit", labelVi: "Nhật ký", icon: icons.ShieldCheck },
];

export function CoordinatorSidebar({ active, onNav, isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (_) {
      // Kể cả lỗi vẫn logout FE bình thường.
    } finally {
      dispatch(logoutSuccess());
      navigate("/");
    }
  };

  return (
    <RoleSidebar
      active={active}
      onNav={onNav}
      isOpen={isOpen}
      onClose={onClose}
      onLogout={handleLogout}
      navItems={navItems}
      brandTitle="SEAL"
      brandSubtitle="Coordinator Console"
      brandMeta="Hackathon Operations"
      userName={user?.username || user?.email || "Coordinator"}
      roleLabel="Coordinator"
    />
  );
}

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutSuccess } from "../../../store/authSlice";
import authService from "../../../services/authService";
import { RoleSidebar } from "../../shared/RoleSidebar";
import { mentorIcons } from "../shared/mentorIcons";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    labelVi: "Tổng quan",
    icon: mentorIcons.LayoutDashboard,
  },
  {
    id: "teams",
    label: "Assigned Teams",
    labelVi: "Đội phụ trách",
    icon: mentorIcons.Users,
  },
];

export function MentorSidebar({ active, onNav, isOpen, onClose }) {
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
      brandSubtitle="Mentor Console"
      brandMeta="Team Supervision"
      userName={user?.username || user?.email || "Mentor"}
      roleLabel="Mentor"
    />
  );
}

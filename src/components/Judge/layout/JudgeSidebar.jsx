import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutSuccess } from "../../../store/authSlice";
import authService from "../../../services/authService";
import { RoleSidebar } from "../../shared/RoleSidebar";
import { judgeIcons } from "../shared/judgeIcons";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    labelVi: "Tổng quan",
    icon: judgeIcons.LayoutDashboard,
  },
  {
    id: "rounds",
    label: "Rounds",
    labelVi: "Vòng chấm",
    icon: judgeIcons.CalendarDays,
  },
  {
    id: "scoring",
    label: "Scoring",
    labelVi: "Chấm điểm",
    icon: judgeIcons.Gavel,
  },
  {
    id: "tie-break",
    label: "Tie-break",
    labelVi: "Chấm đồng hạng",
    icon: judgeIcons.Scale,
  },
  {
    id: "history",
    label: "History",
    labelVi: "Lịch sử điểm",
    icon: judgeIcons.FileText,
  },
  {
    id: "ranking",
    label: "Ranking",
    labelVi: "Bảng xếp hạng",
    icon: judgeIcons.Trophy,
  },
];

export function JudgeSidebar({ active, onNav, isOpen, onClose }) {
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
      brandSubtitle="Judge Console"
      brandMeta="Scoring Workspace"
      BrandIcon={judgeIcons.ShieldCheck}
      userName={user?.username || user?.email || "Judge"}
      roleLabel="Judge"
    />
  );
}

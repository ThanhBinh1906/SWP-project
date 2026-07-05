import { Code2, CloudUpload, Trophy, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutSuccess } from "../../store/authSlice";
import authService from "../../services/authService";
import { RoleSidebar } from "../shared/RoleSidebar";

const navItems = [
  {
    id: "challenges",
    label: "View Challenges",
    labelVi: "Xem đề",
    icon: Code2,
  },
  {
    id: "submit",
    label: "Submit Project",
    labelVi: "Nộp bài",
    icon: CloudUpload,
  },
  {
    id: "team",
    label: "Team Information",
    labelVi: "Thông tin đội",
    icon: Users,
  },
  {
    id: "ranking",
    label: "Ranking",
    labelVi: "Bảng xếp hạng",
    icon: Trophy,
  },
];

export function Sidebar({ active, onNav, isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { myTeam } = useSelector((s) => s.team);

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
      brandTitle="FPT Hackathon"
      brandSubtitle="Leader Workspace"
      brandMeta={myTeam?.teamName || "Chưa có đội"}
      userName={user?.username || user?.email || "Leader"}
      roleLabel="Leader"
    />
  );
}

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import PasswordInput, { authLabelClass } from "./PasswordInput";
import authService from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#F26F21]/60 focus:ring-1 focus:ring-[#F26F21]/30 transition-colors";

const ROLE_ROUTES = {
  Coordinator: "/admin/dashboard",
  Leader: "/dashboard",
  Mentor: "/mentor/dashboard",
  Judge: "/judge/dashboard",
  Pending: "/pending",
};

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const data = res.data.data;
      dispatch(loginSuccess(data));
      handleClose();
      console.log("systemRole:", data.systemRole);
      navigate(ROLE_ROUTES[data.systemRole] || "/");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      if (status === 403) setError("Tài khoản đang chờ Coordinator duyệt.");
      else if (status === 400)
        setError(msg || "Email hoặc mật khẩu không đúng.");
      else setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Login"
      subtitle="Sign in with your Gmail and password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Gmail
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <PasswordInput
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-5 py-3 bg-[#F26F21] text-white text-sm font-bold tracking-wider uppercase rounded-lg glow-orange hover:bg-[#e05a10] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang đăng nhập..." : "Login"}
        </button>
      </form>
    </Modal>
  );
}

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import PasswordInput, { authLabelClass } from "./PasswordInput";
import authService from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";
import { getRedirectPathByUser } from "../../utils/roleHelpers";
import LoadingActionText from "../shared/LoadingActionText";

const inputClass =
  "w-full px-4 py-2 rounded-lg bg-[#0F121E] border border-white/[0.18] text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#F26F21] focus:ring-2 focus:ring-[#F26F21]/30 hover:border-white/[0.3] transition-all";

const initialResetForm = {
  otpCode: "",
  newPassword: "",
  confirmPassword: "",
};

const getApiMessage = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data?.message === "string" && data.message) return data.message;
  if (typeof data?.title === "string" && data.title) return data.title;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat?.()[0];
    if (first) return first;
  }
  return fallback;
};

export default function LoginModal({ open, onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetMessages();
  };

  const handleClose = () => {
    setMode("login");
    setEmail("");
    setPassword("");
    setResetForm(initialResetForm);
    resetMessages();
    onClose();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const data = res.data.data;
      const user = {
        ...data,
        roles: Array.isArray(data.roles) ? data.roles : [],
      };
      dispatch(loginSuccess(user));
      handleClose();
      navigate(getRedirectPathByUser(user));
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) setError("Tài khoản đang chờ Coordinator duyệt.");
      else if (status === 400)
        setError(getApiMessage(err, "Email hoặc mật khẩu không đúng."));
      else setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email });
      setSuccess(
        res.data?.message ||
          "Vui lòng kiểm tra email để nhận mã xác nhận OTP.",
      );
      setMode("reset");
    } catch (err) {
      setError(getApiMessage(err, "Không thể gửi OTP. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const payload = {
        email,
        otpCode: resetForm.otpCode,
        newPassword: resetForm.newPassword,
        confirmPassword: resetForm.confirmPassword,
      };
      const res = await authService.resetPassword(payload);
      setPassword("");
      setResetForm(initialResetForm);
      setSuccess(
        res.data?.message ||
          "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
      );
      setMode("login");
    } catch (err) {
      setError(
        getApiMessage(err, "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại."),
      );
    } finally {
      setLoading(false);
    }
  };

  const updateResetForm = (field) => (e) => {
    setResetForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const modalCopy = {
    login: {
      title: "Đăng nhập",
      subtitle: "Đăng nhập bằng email và mật khẩu của bạn",
    },
    forgot: {
      title: "Quên mật khẩu",
      subtitle: "Nhập email để nhận mã xác nhận OTP",
    },
    reset: {
      title: "Đặt lại mật khẩu",
      subtitle: "Nhập OTP trong email và mật khẩu mới",
    },
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={modalCopy[mode].title}
      subtitle={modalCopy[mode].subtitle}
    >
      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className={authLabelClass}>
              Email
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
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="text-xs font-semibold text-[#F26F21] hover:text-[#ff8a3d]"
            >
              Quên mật khẩu?
            </button>
          </div>

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          {success && (
            <p className="text-emerald-400 text-xs font-medium">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-5 py-2.5 bg-[#F26F21] text-white text-sm font-semibold tracking-wide rounded-lg hover:bg-[#e05811] shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingActionText>Đang đăng nhập</LoadingActionText> : "Đăng nhập"}
          </button>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="flex-1 px-5 py-2.5 rounded-lg border border-white/[0.18] text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-[#F26F21] text-white text-sm font-semibold rounded-lg hover:bg-[#e05811] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingActionText>Đang gửi OTP</LoadingActionText> : "Gửi OTP"}
            </button>
          </div>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          {success && (
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300">
              {success}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="reset-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reset-otp" className={authLabelClass}>
              Mã OTP
            </label>
            <input
              id="reset-otp"
              type="text"
              required
              autoComplete="one-time-code"
              placeholder="Nhập mã xác nhận"
              value={resetForm.otpCode}
              onChange={updateResetForm("otpCode")}
              className={inputClass}
            />
          </div>

          <PasswordInput
            id="reset-new-password"
            label="Mật khẩu mới"
            value={resetForm.newPassword}
            onChange={updateResetForm("newPassword")}
            autoComplete="new-password"
          />

          <PasswordInput
            id="reset-confirm-password"
            label="Xác nhận mật khẩu"
            value={resetForm.confirmPassword}
            onChange={updateResetForm("confirmPassword")}
            autoComplete="new-password"
          />

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="flex-1 px-5 py-2.5 rounded-lg border border-white/[0.18] text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Gửi lại OTP
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-[#F26F21] text-white text-sm font-semibold rounded-lg hover:bg-[#e05811] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingActionText>Đang đặt lại</LoadingActionText> : "Đặt lại mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

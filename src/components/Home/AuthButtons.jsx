const btnBase =
  'px-5 py-2 text-sm font-bold tracking-wider uppercase rounded transition-all duration-200';

export function AuthButtons({
  onLoginClick,
  onRegisterClick,
  className = '',
  registerClassName = '',
  loginClassName = '',
  fullWidth = false,
}) {
  const width = fullWidth ? 'w-full' : '';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={onLoginClick}
        className={`${btnBase} ${width} border border-[#F26F21]/60 text-[#F26F21] hover:bg-[#F26F21]/10 ${loginClassName}`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={onRegisterClick}
        className={`${btnBase} ${width} bg-[#F26F21] text-white glow-orange hover:bg-[#e05a10] ${registerClassName}`}
      >
        Register
      </button>
    </div>
  );
}

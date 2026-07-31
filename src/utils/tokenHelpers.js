export function getJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(paddedBase64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = getJwtPayload(token);

  // Backend vẫn là nơi xác thực cuối cùng nếu token không đọc được hoặc không có exp.
  if (!payload || typeof payload.exp !== "number") return false;

  return payload.exp * 1000 <= Date.now();
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

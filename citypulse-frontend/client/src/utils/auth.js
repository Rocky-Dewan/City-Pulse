// small auth utilities for frontend
export const getToken = () => {
  return localStorage.getItem("token");
};

export const getTokenPayload = (token = null) => {
  try {
    const t = token || getToken();
    if (!t) return null;
    const base = t.split(".")[1];
    if (!base) return null;
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (err) {
    console.error("Failed to parse token payload", err);
    return null;
  }
};

export const isLoggedIn = () => !!getToken();

export const isAdmin = () => {
  const p = getTokenPayload();
  return !!(p && p.role === "admin");
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isTokenExpired = (token) => {
  try {
    const p = getTokenPayload(token);
    if (!p) return true;
    if (!p.exp) return false; // no expiry set => assume valid
    const now = Math.floor(Date.now() / 1000);
    return p.exp < now;
  } catch {
    return true;
  }
};

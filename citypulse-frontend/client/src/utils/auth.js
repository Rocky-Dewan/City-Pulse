export const getToken = () => localStorage.getItem("token");

export const isLoggedIn = () => !!getToken();

export const isAdmin = () => {
  const token = getToken();
  if (!token) return false;
  const decoded = JSON.parse(atob(token.split('.')[1]));
  return decoded.role === "admin";
};

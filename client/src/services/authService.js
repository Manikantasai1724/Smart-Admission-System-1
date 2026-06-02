import api from "./api";

export const login = (username, password) => {
  return api.post("/auth/login", { username, password });
};

export const getMe = () => {
  return api.get("/auth/me");
};

export default { login, getMe };

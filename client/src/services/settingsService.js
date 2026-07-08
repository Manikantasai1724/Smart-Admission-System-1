import api from "./api";

export const getSettings = () => {
  return api.get("/settings");
};

export const updateSetting = (key, value) => {
  return api.post("/settings", { key, value });
};

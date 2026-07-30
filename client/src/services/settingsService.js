import api from "./api";

export const getSettings = (options = {}) => {
  return api.get("/settings", options);
};

export const updateSetting = (key, value) => {
  return api.post("/settings", { key, value });
};

// Thin fetch wrapper around the GivePulse backend (Express + SQLite).
// Every request that needs auth automatically attaches the JWT saved at
// login/register. Data is real and persistent on the server -- nothing
// here uses localStorage for storage (only for caching the auth token).

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const TOKEN_KEY = "givepulse:token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the GivePulse server. Check your connection and try again.");
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  auth: {
    register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
    login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
    me: () => request("/auth/me"),
    forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
    resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload, auth: false }),
  },
  donors: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/donors${qs.toString() ? `?${qs}` : ""}`, { auth: false });
    },
    me: () => request("/donors/me"),
    updateMe: (payload) => request("/donors/me", { method: "PUT", body: payload }),
    get: (id) => request(`/donors/${id}`, { auth: false }),
  },
  bloodBanks: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/blood-banks${qs.toString() ? `?${qs}` : ""}`, { auth: false });
    },
    get: (id) => request(`/blood-banks/${id}`, { auth: false }),
    create: (payload) => request("/blood-banks", { method: "POST", body: payload }),
    update: (id, payload) => request(`/blood-banks/${id}`, { method: "PUT", body: payload }),
    remove: (id) => request(`/blood-banks/${id}`, { method: "DELETE" }),
    reserve: (id, bloodGroup) => request(`/blood-banks/${id}/reserve`, { method: "POST", body: { bloodGroup } }),
    myReservations: () => request("/blood-banks/reservations/mine"),
    release: (reservationId) => request(`/blood-banks/reservations/${reservationId}/release`, { method: "POST" }),
  },
  requests: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/requests${qs.toString() ? `?${qs}` : ""}`, { auth: false });
    },
    create: (payload) => request("/requests", { method: "POST", body: payload }),
    update: (id, payload) => request(`/requests/${id}`, { method: "PUT", body: payload }),
    remove: (id) => request(`/requests/${id}`, { method: "DELETE" }),
  },
  donations: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/donations${qs.toString() ? `?${qs}` : ""}`);
    },
    create: (payload) => request("/donations", { method: "POST", body: payload }),
  },
  reports: {
    mine: () => request("/reports"),
    forDonor: (donorProfileId) => request(`/reports/donor/${donorProfileId}`),
    myAnalysis: () => request("/reports/me/analysis"),
    create: (payload) => request("/reports", { method: "POST", body: payload }),
    remove: (id) => request(`/reports/${id}`, { method: "DELETE" }),
    file: (id) => request(`/reports/${id}/file`),
  },
  compatibility: {
    check: (donorId, recipientId) =>
      request("/compatibility/check", { method: "POST", body: { donorId, recipientId } }),
  },
  messages: {
    contacts: () => request("/messages/contacts"),
    thread: (otherId) => request(`/messages/thread/${otherId}`),
    send: (otherId, body) => request(`/messages/thread/${otherId}`, { method: "POST", body: { body } }),
  },
  admin: {
    stats: () => request("/admin/stats"),
    reports: () => request("/admin/reports"),
    donorsWithReports: () => request("/admin/donors-with-reports"),
    donors: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/admin/donors${qs.toString() ? `?${qs}` : ""}`);
    },
    users: () => request("/admin/users"),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
    updateDonor: (id, payload) => request(`/admin/donors/${id}`, { method: "PUT", body: payload }),
    deleteDonor: (id) => request(`/admin/donors/${id}`, { method: "DELETE" }),
    blacklistDonor: (id, blacklisted = true) =>
      request(`/admin/donors/${id}/blacklist`, { method: "PUT", body: { blacklisted } }),
    deleteDonorAccount: (id) => request(`/admin/donors/${id}/account`, { method: "DELETE" }),
  },
  complaints: {
    create: (payload) => request("/complaints", { method: "POST", body: payload }),
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
      return request(`/complaints${qs.toString() ? `?${qs}` : ""}`);
    },
    update: (id, payload) => request(`/complaints/${id}`, { method: "PUT", body: payload }),
    blacklist: (id) => request(`/complaints/${id}/blacklist`, { method: "POST" }),
    image: (id) => request(`/complaints/${id}/image`),
  },
};

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "invoice_token";

function notifyAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  notifyAuthChanged();
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  listInvoices: () => request("/invoices"),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (payload) => request("/invoices", { method: "POST", body: payload }),
  updateInvoice: (id, payload) => request(`/invoices/${id}`, { method: "PUT", body: payload }),
  updateInvoiceStatus: (id, status) =>
    request(`/invoices/${id}/status`, { method: "PATCH", body: { status } }),
  sendInvoiceEmail: (id, payload) =>
    request(`/invoices/${id}/send-email`, { method: "POST", body: payload }),
  listClients: () => request("/clients"),
  createClient: (payload) => request("/clients", { method: "POST", body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: "PUT", body: payload }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),
  listTemplates: () => request("/templates"),
  createTemplate: (payload) => request("/templates", { method: "POST", body: payload }),
  updateTemplate: (id, payload) => request(`/templates/${id}`, { method: "PUT", body: payload }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: "DELETE" }),
};

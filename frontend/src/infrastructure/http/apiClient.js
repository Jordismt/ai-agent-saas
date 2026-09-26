import { supabase } from "../supabase/supabaseClient.js";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Leer la respuesta sin asumir que contiene JSON.
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new Error("Respuesta inesperada del servidor");
      }

      throw new Error(`Error del servidor (${response.status})`);
    }
  }

  // Gestionar errores HTTP.
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Error HTTP ${response.status}`);
  }

  return data;
}

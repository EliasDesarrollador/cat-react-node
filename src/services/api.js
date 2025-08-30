// src/services/api.js
// Cliente API centralizado (fetch) para comunicar el frontend con el backend Express.
// Ventajas: separa la lógica de red de los componentes y facilita pruebas/extensión.

const BASE_URL = 'http://localhost:4000/api';

// Helper: construir query string a partir de un objeto, ignorando valores vacíos
function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  const queryString = qs.toString();
  return queryString ? `?${queryString}` : '';
}

// Obtener lista de productos con filtros/ordenamiento opcionales
// params: { category, q, minPrice, maxPrice, sort }
// options: { signal } => permite cancelar solicitudes al cambiar filtros rápido
export async function fetchProducts(params = {}, options = {}) {
  const url = `${BASE_URL}/products${buildQuery(params)}`;
  const { signal } = options;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const data = await res.json();
    return data; // { items: Product[], total: number }
  } catch (err) {
    // Si la petición fue abortada, re-lanzar o silenciar según preferencia
    if (err?.name === 'AbortError') return { items: [], total: 0 };
    console.error('fetchProducts error:', err);
    throw err;
  }
}

// Obtener un solo producto por id
export async function fetchProductById(id, options = {}) {
  const { signal } = options;
  try {
    const res = await fetch(`${BASE_URL}/products/${id}`, { signal });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err?.name === 'AbortError') return null;
    console.error('fetchProductById error:', err);
    throw err;
  }
}

export const Api = { fetchProducts, fetchProductById };

// server/index.js
// Backend sencillo con Express que expone endpoints para una tienda.
// Archivo comentado en español explicando cada sección.

import express from 'express'; // Framework para crear el servidor HTTP y definir rutas
import cors from 'cors'; // Middleware para habilitar CORS (acceso desde otros orígenes)

const app = express(); // Instancia principal de la aplicación Express
const PORT = process.env.PORT || 4000; // Puerto de escucha (usa PORT del entorno o 4000 por defecto)

// ========================
// Middlewares globales
// ========================
// Habilita CORS para que el frontend (p. ej., Vite en 5173) pueda consumir esta API sin bloqueos del navegador
app.use(cors());
// Habilita el parseo automático de JSON en el body de las peticiones entrantes (req.body)
app.use(express.json());

// ========================
// Datos en memoria (catálogo)
// ========================
// En una app real, estos datos vendrían de una base de datos.
// Estructura de cada producto:
// - id: identificador único (string)
// - title: nombre visible del producto
// - description: descripción resumida
// - price: precio en número decimal
// - images: rutas a imágenes estáticas servidas por el frontend
// - category: categoría para filtrar (e.g., hats, hoodies)
// - colors: variaciones de color disponibles
// - sizes: talles disponibles
// - stock: unidades disponibles
// - featured: si debe destacarse en el listado
const products = [
  {
    id: 'hat-01',
    title: 'Gorro Clásico',
    description: 'Gorro tejido clásico, abrigado y cómodo para el día a día.',
    price: 19.99,
    // Ruta relativa a la carpeta public del frontend
    images: ['/GorroNY.JPG'],
    category: 'hats',
    colors: ['negro', 'gris', 'azul'],
    sizes: ['única'],
    stock: 42,
    featured: true,
  },
  {
    id: 'hat-02',
    title: 'Beanie Urbano',
    description: 'Estilo urbano con tejido elástico y suave.',
    price: 24.99,
    // Por ahora reutiliza la misma imagen
    images: ['/GorroNY.JPG'],
    category: 'hats',
    colors: ['negro', 'verde'],
    sizes: ['única'],
    stock: 25,
    featured: false,
  },
  {
    id: 'hoodie-01',
    title: 'Sudadera Básica',
    description: 'Sudadera con capucha de algodón orgánico, ultra cómoda.',
    price: 39.99,
    images: ['/hoodie_PNG25-1774699148.png'],
    category: 'hoodies',
    colors: ['negro', 'blanco', 'azul'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    featured: true,
  },
  {
    id: 'hoodie-02',
    title: 'Sudadera Oversize',
    description: 'Corte oversize para un look relajado, interior afelpado.',
    price: 49.99,
    images: ['/sudaderaoversize.png'],
    category: 'hoodies',
    colors: ['gris', 'beige'],
    sizes: ['M', 'L', 'XL'],
    stock: 12,
    featured: false,
  },
];

// ===================================================
// Helper/servicio para consultar productos con filtros
// ===================================================
// Parámetros esperados (provenientes de query string):
// - category: filtra por categoría exacta
// - q: término de búsqueda; busca en título y descripción (sin distinción de mayúsculas)
// - minPrice, maxPrice: filtra por rango de precios
// - sort: 'price_asc' | 'price_desc' | 'title_asc'
function queryProducts({ category, q, minPrice, maxPrice, sort } = {}) {
  let result = [...products]; // Copia para no mutar el array original

  // Filtrado por categoría exacta
  if (category) {
    result = result.filter(p => p.category === category);
  }

  // Búsqueda por término en título o descripción
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );
  }

  // Filtro por precio mínimo
  if (minPrice !== undefined) {
    const min = parseFloat(minPrice);
    if (!Number.isNaN(min)) result = result.filter(p => p.price >= min);
  }

  // Filtro por precio máximo
  if (maxPrice !== undefined) {
    const max = parseFloat(maxPrice);
    if (!Number.isNaN(max)) result = result.filter(p => p.price <= max);
  }

  // Ordenamientos soportados
  if (sort) {
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sort === 'title_asc') result.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Respuesta con items y total (útil para paginación futura)
  return { items: result, total: result.length };
}

// ========================
// Rutas HTTP (endpoints)
// ========================

// GET /api/products
// Devuelve una lista de productos con soporte de filtros/búsqueda/orden.
// Query params soportados: category, q, minPrice, maxPrice, sort.
app.get('/api/products', (req, res) => {
  const { category, q, minPrice, maxPrice, sort } = req.query; // Extrae filtros desde la URL
  const data = queryProducts({ category, q, minPrice, maxPrice, sort }); // Aplica filtros
  res.json(data); // Responde en formato JSON
});

// GET /api/products/:id
// Devuelve un único producto por su id. Si no existe, responde 404.
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// GET /api/health
// Endpoint simple de salud del servicio, útil para monitoreo.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ========================
// Inicio del servidor
// ========================
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});

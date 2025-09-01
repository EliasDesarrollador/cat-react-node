// src/App.jsx
// Componente principal de la aplicación (MVP inicial de la tienda)
// Objetivos de esta versión:
// - Consumir la API (ya creada en server/index.js) para listar productos
// - Soportar filtros básicos: categoría, búsqueda por texto, rango de precio, ordenamiento
// - Carrito mínimo en memoria (sin persistencia todavía)
// - Diseño responsivo simple usando CSS básico (refinaremos estilos en el siguiente paso)
// - Comentarios detallados en español para facilitar el aprendizaje

import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Api } from './services/api'

// Utilidad para formatear precios en moneda local
const formatPrice = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)

// Dado que nuestra API devuelve rutas de imágenes locales (p.ej. /img/..),
// y estas podrían no existir aún en /public/img, proveemos un fallback
// a un placeholder para evitar imágenes rotas.
const resolveImage = (product) => {
  const first = product?.images?.[0]
  if (!first || first.startsWith('/img/')) {
    // Placeholder con el título del producto
    return `https://placehold.co/600x600?text=${encodeURIComponent(product.title)}`
  }
  return first
}


// Componente: Barra de navegación superior
function Navbar({ cartCount, onOpenCart }) {
  return (
    <header className="nav">
      {/* Sección izquierda: Marca / título */}
      <div className="nav__brand">Sudaderas & Gorros</div>
      {/* Sección derecha: Indicador del carrito (futuro: botón para abrir modal/drawer) */}
      <div className="nav__actions">
        <button className="btn btn--ghost" aria-label="Ver carrito" onClick={onOpenCart}>
          🛒 <span className="badge">{cartCount}</span>
        </button>
      </div>
    </header>
  )
}

// Componente: Controles de filtrado y ordenamiento

function FilterBar({ filters, onChange }) {
  // Manejadores locales que actualizan el objeto de filtros del padre
  const handleInput = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  return (
    <section className="filters">
      {/* Búsqueda por texto en título y descripción */}
      <div className="filters__group">
        <label className="label">Buscar</label>
        <input
          className="input"
          type="search"
          placeholder="sudadera, gorro, urbano..."
          value={filters.q}
          onChange={handleInput('q')}
        />
      </div>

      {/* Categoría: hats / hoodies */}
      <div className="filters__group">
        <label className="label">Categoría</label>
        <select className="input" value={filters.category} onChange={handleInput('category')}>
          <option value="">Todas</option>
          <option value="hats">Gorros</option>
          <option value="hoodies">Sudaderas</option>
        </select>
      </div>

      {/* Rango de precio mínimo y máximo */}
      <div className="filters__group filters__group--row">
        <div>
          <label className="label">Precio mín.</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={filters.minPrice}
            onChange={handleInput('minPrice')}
          />
        </div>
        <div>
          <label className="label">Precio máx.</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="9999"
            value={filters.maxPrice}
            onChange={handleInput('maxPrice')}
          />
        </div>
      </div>

      {/* Ordenamiento */}
      <div className="filters__group">
        <label className="label">Ordenar por</label>
        <select className="input" value={filters.sort} onChange={handleInput('sort')}>
          <option value="">Relevancia</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="title_asc">Título: A → Z</option>
        </select>
      </div>
    </section>
  )
}

// Componentes atómicos: Precio, Disponibilidad y Botón Agregar
function PriceTag({ price }) {
  return <p className="card__price">{formatPrice(price)}</p>
}

function AvailabilityBadge({ stock }) {
  const hasStockInfo = stock !== undefined && stock !== null
  const inStock = !hasStockInfo || Number(stock) > 0
  const label = inStock ? `Disponible${hasStockInfo ? `: ${stock}` : ''}` : 'Agotado'
  const style = {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: inStock ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
    color: inStock ? '#065f46' : '#7f1d1d',
  }
  return <span style={style}>{label}</span>
}

function AddToCartButton({ product, onAddToCart }) {
  const hasStockInfo = product && product.stock !== undefined && product.stock !== null
  const disabled = !product || (hasStockInfo && Number(product.stock) <= 0)
  return (
    <button className="btn" disabled={disabled} onClick={() => onAddToCart(product)}>
      {disabled ? 'Sin stock' : 'Agregar al carrito'}
    </button>
  )
}

// Componente: Tarjeta de producto
function ProductCard({ product, onAddToCart }) {
  const img = resolveImage(product)
  return (
    <article className="card">
      <div className="card__media">
        <img src={img} alt={product.title} />
      </div>
      <div className="card__body">
        <h3 className="card__title">{product.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          <PriceTag price={product.price} />
          <AvailabilityBadge stock={product.stock} />
        </div>
        <AddToCartButton product={product} onAddToCart={onAddToCart} />
      </div>
    </article>
  )
}

// Componente: Grid de productos responsivo
function ProductGrid({ products, onAddToCart }) {
  if (!products?.length) {
    return <p className="empty">No hay productos que coincidan con los filtros.</p>
  }

  return (
    <section className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </section>
  )
}

function CartDrawer({ open, onClose, items, total, onInc, onDec, onRemove }) {
  if (!open) return null
  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 40,
        }}
      />
      <aside
        aria-label="Carrito"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100dvh',
          width: 'min(480px, 100%)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          padding: '1rem',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: '1rem',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Tu carrito</h2>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div style={{ overflow: 'auto', display: 'grid', gap: '0.75rem' }}>
          {items.length === 0 ? (
            <p className="empty">Tu carrito está vacío.</p>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 12, padding: '0.5rem' }}>
                <img src={resolveImage(product)} alt={product.title} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong>{product.title}</strong>
                    <button className="btn btn--ghost" onClick={() => onRemove(product.id)} aria-label="Quitar">🗑️</button>
                  </div>
                  <span className="card__price">{formatPrice(product.price)} c/u</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => onDec(product.id)} aria-label="Disminuir">−</button>
                    <span>{qty}</span>
                    <button className="btn" onClick={() => onInc(product.id)} aria-label="Aumentar">+</button>
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{formatPrice(product.price * qty)}</div>
              </div>
            ))
          )}
        </div>
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div><strong>Total:</strong> {formatPrice(total)}</div>
          <button className="btn btn--primary" disabled={items.length === 0}>Finalizar compra</button>
        </footer>
      </aside>
    </>
  )
}

export default function App() {

  // Estado: filtros de búsqueda
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: '',
  })

  // Estado: datos de productos
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estado: carrito simple en memoria
  // Estructura: { [productId]: quantity }
  const [cart, setCart] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [productMap, setProductMap] = useState({})


  // Derivado: cantidad total de productos en el carrito
  const cartCount = useMemo(
    () => Object.values(cart).reduce((acc, qty) => acc + qty, 0),
    [cart]
  )

  const productsById = productMap


  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: productsById[id], qty }))
        .filter((i) => i.product),
    [cart, productsById]
  )

  // Efecto: cargar productos cada que cambien los filtros

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Llamada a la API con los filtros actuales
        const { items, total } = await Api.fetchProducts(
          {
            q: filters.q,
            category: filters.category,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sort: filters.sort,
          },
          { signal: controller.signal }
        )
        setItems(items)
        setTotal(total)
        setProductMap((prev) => ({ ...prev, ...Object.fromEntries(items.map((p) => [p.id, p])) }))
      } catch (err) {
        // Si el backend no está activo, mostraremos un error amigable
        setError('No se pudo cargar el catálogo. ¿Iniciaste el servidor en el puerto 4000?')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [filters])

  // Acción: agregar producto al carrito
  const handleAddToCart = (product) => {
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))
  }

  const updateQty = (id, qty) => {
    setCart((prev) => {
      const next = { ...prev }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }
  const incQty = (id) => updateQty(id, (cart[id] || 0) + 1)
  const decQty = (id) => updateQty(id, (cart[id] || 0) - 1)
  const removeItem = (id) => updateQty(id, 0)


  // Derivado: total del carrito (precio acumulado)
      const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, { product, qty }) => acc + product.price * qty, 0)
  }, [cartItems])

  return (
    <div className="app">
      {/* Barra superior */}
      <Navbar cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />


      {/* Contenedor principal */}
      <main className="container">
        {/* Panel de filtros */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Estados de carga / error */}
        {loading && <p className="status">Cargando productos...</p>}
        {error && <p className="status status--error">{error}</p>}

        {/* Resultados */}
        {!loading && !error && (
          <>
            <div className="results__meta">Resultados: {total}</div>
            <ProductGrid products={items} onAddToCart={handleAddToCart} />
          </>
        )}
      </main>

      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
        onInc={incQty}
        onDec={decQty}
        onRemove={removeItem}
      />
      
      
      {/* Resumen fijo del carrito (simple) */}
      
      <footer className="cartbar">
        <div>
          <strong>Carrito:</strong> {cartCount} artículos
        </div>
        <div>
          <strong>Total:</strong> {formatPrice(cartTotal)}
        </div>
        <button className="btn btn--primary" disabled={cartCount === 0}>
          Finalizar compra
        </button>
      </footer>
    </div>
  )
}

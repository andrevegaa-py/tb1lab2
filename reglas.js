// reglas.js
// Reglas de negocio del sistema de gestión de pedidos (importación/dropshipping)

// Tiempos estimados de entrega por proveedor, en días
const TIEMPOS_ESTIMADOS = {
  "AliExpress": 25,
  "1688.com": 20,
  "DHgate": 30,
  "Temu": 15,
  "Shenzhen Dropship Ltd.": 35,
};

const ESTADOS_SIN_DEMORA = ["Listo para entrega", "Entregado"];

/**
 * REGLA 1 — Saldo pendiente
 * saldo = precioTotal - montoAdelantado
 * - Nunca negativo (si adelantó de más, saldo = 0)
 * - Si ya está pagado, saldo = 0 sin importar el cálculo
 * - Si faltan datos, devuelve null (el llamador debe mostrar "Datos incompletos")
 */
function calcularSaldoPendiente(precioTotal, montoAdelantado, pagado) {
  if (pagado) {
    return 0;
  }
  const precio = parseFloat(precioTotal);
  const adelanto = parseFloat(montoAdelantado);

  if (isNaN(precio) || isNaN(adelanto)) {
    return null; // Datos incompletos
  }

  const saldo = precio - adelanto;
  return saldo < 0 ? 0 : saldo;
}

/**
 * REGLA 2 — Pedido demorado
 * Compara días transcurridos desde fechaPedido contra el tiempo estimado
 * del proveedor. Devuelve uno de:
 *   "Demorado" | "En tiempo" | "Sin estimar" | "Fecha no registrada" | "Fecha inválida"
 */
function calcularEstadoDemora(fechaPedido, proveedor, estadoActual, fechaHoy = new Date()) {
  if (ESTADOS_SIN_DEMORA.includes(estadoActual)) {
    return "En tiempo"; // ya llegó, nunca es demorado
  }

  if (!fechaPedido) {
    return "Fecha no registrada";
  }

  const fechaPed = new Date(fechaPedido);
  if (isNaN(fechaPed.getTime())) {
    return "Fecha inválida";
  }
  if (fechaPed > fechaHoy) {
    return "Fecha inválida"; // fecha en el futuro
  }

  const tiempoEstimado = TIEMPOS_ESTIMADOS[proveedor];
  if (tiempoEstimado === undefined) {
    return "Sin estimar";
  }

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasTranscurridos = Math.floor((fechaHoy - fechaPed) / msPorDia);

  return diasTranscurridos > tiempoEstimado ? "Demorado" : "En tiempo";
}

// --- Comprobación de los dos ejemplos (revisar en la consola del navegador) ---
console.log(
  "Ejemplo Regla 1 (esperado $170):",
  calcularSaldoPendiente(250.0, 80.0, false)
);
console.log(
  "Ejemplo Regla 2 (esperado 'Demorado'):",
  calcularEstadoDemora("2026-08-18", "1688.com", "En tránsito", new Date("2026-09-12"))
);

// --- Almacenamiento de pedidos (localStorage) ---

const CLAVE_PEDIDOS = "pedidos";

const PEDIDOS_DE_EJEMPLO = [
  { id: 1, cliente: "Carlos Méndez", producto: "Smartwatch Xiaomi Band 8", proveedor: "1688.com", fechaPedido: "2026-08-18", estadoActual: "En tránsito", precioTotal: 150.0, montoAdelantado: 50.0, pagado: false },
  { id: 2, cliente: "María González", producto: "Auriculares Bluetooth JBL", proveedor: "AliExpress", fechaPedido: "2026-08-30", estadoActual: "En tránsito", precioTotal: 120.0, montoAdelantado: 60.0, pagado: false },
  { id: 3, cliente: "Lucía Herrera", producto: "Funda iPhone 15 Pro Max", proveedor: "DHgate", fechaPedido: "2026-08-22", estadoActual: "Listo para entrega", precioTotal: 45.0, montoAdelantado: 45.0, pagado: true },
  { id: 4, cliente: "Andrés Ríos", producto: "Cargador inalámbrico 65W", proveedor: "Temu", fechaPedido: "2026-09-05", estadoActual: "En proceso", precioTotal: 60.0, montoAdelantado: 20.0, pagado: false },
  { id: 5, cliente: "Sofía Vargas", producto: "Cable USB-C trenzado 2m", proveedor: "Proveedor Nuevo SAC", fechaPedido: "2026-08-27", estadoActual: "En tránsito", precioTotal: 25.0, montoAdelantado: 0, pagado: false },
  { id: 6, cliente: "Diego Castillo", producto: "Lámpara LED escritorio", proveedor: "Shenzhen Dropship Ltd.", fechaPedido: "", estadoActual: "En proceso", precioTotal: 80.0, montoAdelantado: 30.0, pagado: false },
];

/** Devuelve todos los pedidos guardados. Si es la primera vez (nada guardado), carga los de ejemplo. */
function obtenerPedidos() {
  const guardado = localStorage.getItem(CLAVE_PEDIDOS);
  if (guardado === null) {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(PEDIDOS_DE_EJEMPLO));
    return PEDIDOS_DE_EJEMPLO;
  }
  return JSON.parse(guardado);
}

/** Guarda un pedido nuevo (le asigna un id automático) y devuelve la lista actualizada. */
function agregarPedido(pedido) {
  const pedidos = obtenerPedidos();
  const nuevoId = pedidos.length > 0 ? Math.max(...pedidos.map((p) => p.id)) + 1 : 1;
  const pedidoConId = { id: nuevoId, ...pedido };
  pedidos.push(pedidoConId);
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  return pedidoConId;
}

/** Busca un pedido por id. */
function obtenerPedidoPorId(id) {
  const pedidos = obtenerPedidos();
  return pedidos.find((p) => p.id === Number(id));
}

/** Actualiza campos de un pedido existente (por ejemplo, marcarlo como pagado). */
function actualizarPedido(id, cambios) {
  const pedidos = obtenerPedidos();
  const index = pedidos.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;
  pedidos[index] = { ...pedidos[index], ...cambios };
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  return pedidos[index];
}

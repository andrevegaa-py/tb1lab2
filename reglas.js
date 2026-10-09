// =========================================================
// 1. CONFIGURACIÓN DE SUPABASE
// =========================================================
const supabaseUrl = 'https://ugjbpftefipenjmsjpsp.supabase.co';
const supabaseKey = 'sb_publishable_qNrt9v8vQMhULMdh-7qmyw_3wn4Ylkq';
// Le cambiamos el nombre a clienteSupabase para que no choque
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);


// =========================================================
// 2. REGLAS DE NEGOCIO (Adaptadas a Supabase)
// =========================================================

/**
 * REGLA 1 — Saldo pendiente
 * saldo = precio_total - adelanto
 */
function calcularSaldoPendiente(precioTotal, montoAdelantado, estado) {
  if (estado === "entregado" || estado === "pagado") {
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
 * Compara días transcurridos desde fecha_pedido_proveedor contra plazo_estimado_dias
 */
function calcularEstadoDemora(fechaPedidoProveedor, plazoEstimadoDias, estadoActual, fechaHoy = new Date()) {
  const ESTADOS_SIN_DEMORA = ["entregado", "listo para entrega"];
  
  if (ESTADOS_SIN_DEMORA.includes(estadoActual.toLowerCase())) {
    return "En tiempo"; // ya llegó, nunca es demorado
  }

  if (!fechaPedidoProveedor) {
    return "Fecha no registrada";
  }

  // Si la fecha de supabase viene como string (ej. "2026-08-18")
  const fechaPed = new Date(fechaPedidoProveedor + 'T00:00:00'); 
  if (isNaN(fechaPed.getTime()) || fechaPed > fechaHoy) {
    return "Fecha inválida";
  }

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasTranscurridos = Math.floor((fechaHoy - fechaPed) / msPorDia);

  return diasTranscurridos > plazoEstimadoDias ? "Demorado" : "En tiempo";
}


// =========================================================
// 3. FUNCIONES DE BASE DE DATOS (CRUD en Supabase)
// =========================================================

/** 
 * Obtiene TODOS los pedidos desde Supabase 
 */
async function obtenerPedidos() {
  const { data, error } = await clienteSupabase
    .from('pedidos')
    .select('*')
    .order('id', { ascending: false }); // Ordenar del más nuevo al más viejo

  if (error) {
    console.error("Error al obtener pedidos:", error);
    return [];
  }
  return data;
}

/** 
 * Guarda un pedido nuevo en Supabase
 */
async function agregarPedido(pedido) {
  const { data, error } = await clienteSupabase
    .from('pedidos')
    .insert([pedido])
    .select();

  if (error) {
    console.error("Error al agregar pedido:", error);
    alert("Hubo un error al guardar: " + error.message);
    return null;
  }
  return data[0];
}

/** 
 * Busca un pedido por su ID en Supabase
 */
async function obtenerPedidoPorId(id) {
  const { data, error } = await clienteSupabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error al buscar pedido:", error);
    return null;
  }
  return data;
}

/** 
 * Actualiza campos de un pedido existente en Supabase 
 */
async function actualizarPedido(id, cambios) {
  const { data, error } = await clienteSupabase
    .from('pedidos')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error al actualizar pedido:", error);
    return null;
  }
  return data[0];
}

// Listas de opciones de los clientes (se usan en el navegador y en el servidor)

export const PLAZOS = [
  { dias: 0, nombre: "Contado" },
  { dias: 8, nombre: "8 días" },
  { dias: 15, nombre: "15 días" },
  { dias: 30, nombre: "30 días" },
  { dias: 45, nombre: "45 días" },
  { dias: 60, nombre: "60 días" },
  { dias: 90, nombre: "90 días" },
] as const;

export const DIAS_PLAZO = PLAZOS.map((p) => p.dias) as number[];

export function nombrePlazo(dias: number) {
  return PLAZOS.find((p) => p.dias === dias)?.nombre ?? `${dias} días`;
}

export const ESTADOS_CLIENTE = {
  pendiente: "Pendiente",
  validado: "Validado",
  inactivo: "Inactivo",
} as const;

export type EstadoCliente = keyof typeof ESTADOS_CLIENTE;

export const TIPOS_NEGOCIO = [
  "Serviteca",
  "Lubricentro",
  "Montallantas",
  "Almacén de repuestos",
  "Taller mecánico",
  "Lavadero",
  "Concesionario",
  "Distribuidor",
  "Estación de servicio",
  "Consumidor final",
  "Otro",
];

// Sugerencias al escribir la ciudad (se puede escribir cualquier otra)
export const CIUDADES_SUGERIDAS = [
  "Cali", "Palmira", "Jamundí", "Yumbo", "Candelaria", "Buga", "Tuluá", "Cartago",
  "Buenaventura", "Popayán", "Pasto", "Bogotá", "Medellín", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Armenia", "Ibagué", "Neiva", "Villavicencio",
  "Santa Marta", "Cúcuta",
];

export const CARGOS = [
  "Propietario",
  "Administrador",
  "Comprador",
  "Jefe de taller",
  "Contador",
  "Cartera",
  "Vendedor",
  "Otro",
];

export const PRODUCTOS_QUE_VENDE = [
  "Plumillas otras marcas",
  "Lubricantes",
  "Filtros",
  "Repuestos",
  "Accesorios",
  "Vidrios y espejos",
  "Llantas",
  "Baterías",
  "Frenos",
  "Suspensión",
  "Refrigerantes",
  "Electricidad",
  "Herramientas",
  "Servicios de mecánica",
];

export const TRAFICO = [
  "0 a 5 carros por día",
  "6 a 15 carros por día",
  "16 a 30 carros por día",
  "31 a 50 carros por día",
  "Más de 50 carros por día",
];

export const DIAS_SEMANA = [
  { clave: "lun", nombre: "Lun" },
  { clave: "mar", nombre: "Mar" },
  { clave: "mie", nombre: "Mié" },
  { clave: "jue", nombre: "Jue" },
  { clave: "vie", nombre: "Vie" },
  { clave: "sab", nombre: "Sáb" },
  { clave: "dom", nombre: "Dom" },
];

// Horas cada media hora, de 5:00 a. m. a 10:00 p. m. (valor "17:30")
export const HORAS = Array.from({ length: 35 }, (_, i) => {
  const minutos = 5 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${minutos % 60 === 0 ? "00" : "30"}`;
});

// "17:30" → "5:30 p. m."
export function horaBonita(hora: string | null | undefined) {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export const DOCUMENTOS = [
  { tipo: "camara_comercio", columna: "camara_comercio_url", corto: "CC", nombre: "Cámara de Comercio" },
  { tipo: "rut", columna: "rut_doc_url", corto: "RUT", nombre: "RUT" },
  { tipo: "tratamiento_datos", columna: "tratamiento_datos_url", corto: "TD", nombre: "Tratamiento de datos" },
] as const;

export type TipoDocumento = (typeof DOCUMENTOS)[number]["tipo"] | "foto";

export const TIPOS_INTERACCION = {
  visita: "Visita",
  llamada: "Llamada",
  reunion: "Reunión",
  email: "Correo",
} as const;

export type TipoInteraccion = keyof typeof TIPOS_INTERACCION;

// Archivos permitidos en el almacén (máximo 10 MB)
export const TAMANO_MAXIMO = 10 * 1024 * 1024;
export const TIPOS_ARCHIVO = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Moneda colombiana sin decimales: 36544114 → "$ 36.544.114"
const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
export function pesos(valor: number) {
  return formatoPesos.format(valor);
}

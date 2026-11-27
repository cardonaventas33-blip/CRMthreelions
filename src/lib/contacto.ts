// Enlaces para escribirle a un cliente: WhatsApp (wa.me) y correo (se abre el correo del vendedor)

// Número para WhatsApp: si es celular colombiano de 10 dígitos, se le pone el 57
export function numeroWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 && digitos.startsWith("3") ? `57${digitos}` : digitos;
}

// Solo sirve si tiene al menos 10 dígitos (un fijo de 7 dígitos no tiene WhatsApp)
export function tieneWhatsApp(telefono: string | null | undefined): telefono is string {
  return Boolean(telefono) && numeroWhatsApp(telefono!).length >= 10;
}

export function enlaceWhatsApp(telefono: string, mensaje?: string) {
  const base = `https://wa.me/${numeroWhatsApp(telefono)}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function esCorreo(texto: string | null | undefined): texto is string {
  return Boolean(texto) && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(texto!.trim());
}

// Abre el programa de correo del vendedor (Gmail, Outlook…) con el asunto y el texto listos
export function enlaceCorreo(para: string, asunto: string, cuerpo: string) {
  const texto = cuerpo.replace(/\r?\n/g, "\r\n");
  return `mailto:${para.trim()}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
}

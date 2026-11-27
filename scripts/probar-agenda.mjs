// Pruebas de las funciones de fechas y enlaces de la agenda (sin pantalla).
// Uso, en la carpeta del proyecto: node scripts/probar-agenda.mjs
// (Node 24 entiende los archivos .ts directamente)
import assert from "node:assert/strict";

const f = await import(new URL("../src/lib/agenda/fechas.ts", import.meta.url).href);
const k = await import(new URL("../src/lib/contacto.ts", import.meta.url).href);

let ok = 0;
const prueba = (nombre, fn) => {
  fn();
  ok++;
  console.log(`OK  ${nombre}`);
};

prueba("hoy en Colombia a las 10 p. m. del 26 sigue siendo 26", () =>
  assert.equal(f.hoyColombia(Date.UTC(2026, 10, 27, 3, 0)), "2026-11-26"));
prueba("domingo 29 de noviembre es día 0", () => assert.equal(f.diaSemana("2026-11-29"), 0));
prueba("domingo pasa al lunes", () => assert.equal(f.sinDomingo("2026-11-29"), "2026-11-30"));
prueba("lunes de la semana del sábado 28", () => assert.equal(f.lunesDe("2026-11-28"), "2026-11-23"));
prueba("lunes de la semana del domingo 29", () => assert.equal(f.lunesDe("2026-11-29"), "2026-11-23"));
prueba("noviembre 2026: 5 semanas de lunes a sábado, desde el 2", () => {
  const s = f.semanasDelMes("2026-11-15");
  assert.equal(s.length, 5);
  assert.deepEqual(s[0], ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]);
  assert.equal(s[4][0], "2026-11-30");
});
prueba("agosto 2026 (empieza sábado): la primera fila trae el sábado 1", () => {
  const s = f.semanasDelMes("2026-08-10");
  assert.equal(s[0][5], "2026-08-01");
  assert.equal(s.at(-1).some((d) => d === "2026-08-31"), true);
});
prueba("mes anterior y siguiente (cambio de año)", () => {
  assert.equal(f.primerDiaDelMes("2026-01-15", -1), "2025-12-01");
  assert.equal(f.primerDiaDelMes("2026-12-15", 1), "2027-01-01");
});
prueba("9:30 a. m. en Colombia se guarda como 14:30 UTC", () =>
  assert.equal(f.instanteColombia("2026-11-28", "09:30").toISOString(), "2026-11-28T14:30:00.000Z"));
prueba("y se lee de vuelta como 9:30 del 28", () =>
  assert.deepEqual(f.partesColombia("2026-11-28T14:30:00+00:00"), { fecha: "2026-11-28", hora: "09:30" }));
prueba("una cita a las 11 p. m. sigue siendo del mismo día", () =>
  assert.deepEqual(f.partesColombia("2026-11-29T04:00:00+00:00"), { fecha: "2026-11-28", hora: "23:00" }));
prueba("fechas inválidas se rechazan", () => {
  assert.equal(f.esFecha("2026-02-30"), false);
  assert.equal(f.esFecha("hola"), false);
  assert.equal(f.esFecha("2026-11-28"), true);
});
prueba("texto de la hora", () => assert.match(f.textoHora("2026-11-28T14:30:00+00:00"), /^9:30/));
prueba("enlace de Google Calendar con hora UTC", () => {
  const url = new URL(f.enlaceGoogleCalendar({ titulo: "Visita · Three lions", inicio: "2026-11-28T14:30:00+00:00", fin: "2026-11-28T14:45:00+00:00", lugar: "Cali" }));
  assert.equal(url.hostname, "calendar.google.com");
  assert.equal(url.searchParams.get("dates"), "20261128T143000Z/20261128T144500Z");
  assert.equal(url.searchParams.get("text"), "Visita · Three lions");
  assert.equal(url.searchParams.get("ctz"), "America/Bogota");
});
prueba("celular colombiano lleva 57", () => assert.equal(k.numeroWhatsApp("300 123 4567"), "573001234567"));
prueba("celular con +57 no se duplica", () => assert.equal(k.numeroWhatsApp("+57 300 123 4567"), "573001234567"));
prueba("un fijo de 7 dígitos no tiene WhatsApp", () => assert.equal(k.tieneWhatsApp("4441234"), false));
prueba("enlace de WhatsApp con mensaje", () =>
  assert.equal(k.enlaceWhatsApp("3001234567", "Hola Ana, ¿cómo está?"), `https://wa.me/573001234567?text=${encodeURIComponent("Hola Ana, ¿cómo está?")}`));
prueba("correo válido e inválido", () => {
  assert.equal(k.esCorreo("ventas@cliente.com"), true);
  assert.equal(k.esCorreo("no es correo"), false);
});
prueba("enlace de correo con asunto y saltos de línea", () => {
  const url = k.enlaceCorreo("ventas@cliente.com", "Pedido #5 · Three Lions SAS", "Hola,\n\nTotal: $ 10.000");
  assert.ok(url.startsWith("mailto:ventas@cliente.com?subject=Pedido%20%235"));
  assert.ok(url.includes("%0D%0A%0D%0ATotal"));
});

console.log(`\n${ok} pruebas OK`);

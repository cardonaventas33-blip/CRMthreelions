import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { InsigniaPedido } from "@/components/catalogo/insignias";
import { InsigniaEstado, InsigniasDocumentos } from "@/components/clientes/insignias";
import { FormularioInteraccion } from "@/components/clientes/interacciones";
import { BotonCrearPedido } from "@/components/pedidos/crear-pedido";
import { listarPedidos } from "@/lib/catalogo/datos";
import { enlacesFirmados, listarInteracciones, obtenerCliente } from "@/lib/clientes/datos";
import {
  DIAS_SEMANA,
  DOCUMENTOS,
  TIPOS_INTERACCION,
  horaBonita,
  nombrePlazo,
  pesos,
} from "@/lib/clientes/opciones";
import { iniciales } from "@/lib/roles";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ pestana?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  return { title: cliente?.trade_name || cliente?.name || "Cliente" };
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const formatoDia = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

// Número para WhatsApp: si es celular colombiano de 10 dígitos, se le pone el 57
function numeroWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 && digitos.startsWith("3") ? `57${digitos}` : digitos;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wider text-ink-soft uppercase">{etiqueta}</dt>
      <dd className="mt-0.5 break-words">{valor || <span className="text-ink-soft">—</span>}</dd>
    </div>
  );
}

export default async function FichaCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const { pestana = "datos" } = await searchParams;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const [enlaces, interacciones, { pedidos }] = await Promise.all([
    enlacesFirmados([
      cliente.photo_url,
      cliente.rut_doc_url,
      cliente.camara_comercio_url,
      cliente.tratamiento_datos_url,
      ...cliente.sedes.map((s) => s.photo_url),
    ]),
    listarInteracciones(cliente.id),
    listarPedidos({ clienteId: cliente.id, limite: 200 }),
  ]);
  const comprado = pedidos.filter((p) => p.status === "completado").reduce((suma, p) => suma + p.total, 0);

  const pestanas = [
    { clave: "datos", nombre: "Datos" },
    { clave: "interacciones", nombre: `Interacciones (${interacciones.length})` },
    { clave: "pedidos", nombre: `Pedidos (${pedidos.length})` },
  ];
  const activa = pestanas.some((p) => p.clave === pestana) ? pestana : "datos";
  const nombreSede = (idSede: string | null) => cliente.sedes.find((s) => s.id === idSede)?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/clientes" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a clientes
      </Link>

      {/* Encabezado */}
      <div className="mt-2 flex flex-wrap items-start gap-4">
        {cliente.photo_url && enlaces[cliente.photo_url] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={enlaces[cliente.photo_url]} alt="" className="size-16 shrink-0 rounded-2xl border border-line object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand">
            {iniciales({ nombre: cliente.trade_name || cliente.name, correo: "" })}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">{cliente.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            {cliente.trade_name && <span className="font-medium text-ink">{cliente.trade_name}</span>}
            {cliente.nit_rut && <span className="tabular-nums">NIT/CC {cliente.nit_rut}</span>}
            {cliente.city && <span>{cliente.city}</span>}
            <span>Plazo: {nombrePlazo(cliente.payment_term_days)}</span>
            <InsigniaEstado estado={cliente.status} />
          </p>
        </div>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="inline-flex h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Actualizar información
        </Link>
      </div>

      {/* Pestañas */}
      {/* La línea de abajo es una sombra (no un borde) para que no aparezca una barra de desplazamiento */}
      <nav aria-label="Secciones del cliente" className="mt-6 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-line)]">
        {pestanas.map((p) => (
          <Link
            key={p.clave}
            href={`/clientes/${cliente.id}?pestana=${p.clave}`}
            scroll={false}
            aria-current={activa === p.clave ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap ${
              activa === p.clave ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {p.nombre}
          </Link>
        ))}
      </nav>

      {activa === "datos" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="font-semibold">Empresa</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Dato etiqueta="Correo de facturación" valor={cliente.email} />
                <Dato etiqueta="Teléfono" valor={cliente.phone} />
                <Dato etiqueta="Dirección" valor={cliente.address} />
                <Dato etiqueta="Tipo de negocio" valor={cliente.business_type} />
                <Dato etiqueta="Empleados totales" valor={cliente.employees?.toString()} />
                <Dato etiqueta="Creado por" valor={cliente.creador?.name || cliente.creador?.email} />
                <div className="sm:col-span-2">
                  <Dato etiqueta="Observaciones" valor={cliente.notes} />
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="font-semibold">Sedes ({cliente.sedes.length})</h2>
              {cliente.sedes.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">Sin sedes todavía.</p>
              ) : (
                <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {cliente.sedes.map((s) => (
                    <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                      {s.photo_url && enlaces[s.photo_url] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={enlaces[s.photo_url]} alt={`Foto de ${s.name}`} className="aspect-video w-full rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
                          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                          {s.address}, {s.city}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <Dato etiqueta="Horario" valor={s.opens_at && s.closes_at ? `${horaBonita(s.opens_at)} – ${horaBonita(s.closes_at)}` : null} />
                        <Dato
                          etiqueta="Días"
                          valor={DIAS_SEMANA.filter((d) => s.service_days.includes(d.clave)).map((d) => d.nombre).join(", ")}
                        />
                        <Dato etiqueta="Tráfico" valor={s.traffic} />
                        <Dato
                          etiqueta="Empleados · m²"
                          valor={[s.employees, s.square_meters].some((v) => v !== null) ? `${s.employees ?? "—"} · ${s.square_meters ?? "—"}` : null}
                        />
                      </dl>
                      {s.products.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5" aria-label="Productos que vende">
                          {s.products.map((p) => (
                            <li key={p} className="rounded-md bg-mist px-2 py-0.5 text-xs">{p}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="font-semibold">Documentos</h2>
              <div className="mt-3"><InsigniasDocumentos cliente={cliente} /></div>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {DOCUMENTOS.map((d) => {
                  const ruta = cliente[d.columna];
                  const enlace = ruta ? enlaces[ruta] : undefined;
                  return (
                    <li key={d.tipo} className="flex items-center justify-between gap-2">
                      <span>{d.nombre}</span>
                      {enlace ? (
                        <a href={enlace} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 font-semibold text-brand hover:underline">
                          Ver <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-ink-soft">Falta</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-line p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Users className="size-4 text-brand" aria-hidden />
                Contactos ({cliente.contactos.length})
              </h2>
              {cliente.contactos.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">Sin contactos todavía.</p>
              ) : (
                <ul className="mt-4 flex flex-col divide-y divide-line">
                  {cliente.contactos.map((c) => (
                    <li key={c.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-ink-soft">
                          {[c.role_title, nombreSede(c.site_id)].filter(Boolean).join(" · ") || "Sin cargo"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.receives_sales && <span className="rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">✓ Comercial</span>}
                        {c.receives_collections && <span className="rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">✓ Cartera</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.phone && (
                          <>
                            <a href={`tel:${c.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm hover:bg-mist">
                              <Phone className="size-4" aria-hidden />
                              {c.phone}
                            </a>
                            <a
                              href={`https://wa.me/${numeroWhatsApp(c.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm hover:bg-mist"
                            >
                              <MessageCircle className="size-4 text-ok" aria-hidden />
                              WhatsApp
                            </a>
                          </>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm hover:bg-mist">
                            <Mail className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">{c.email}</span>
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {activa === "interacciones" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          <section className="rounded-xl border border-line p-4 sm:p-5">
            <h2 className="font-semibold">Registrar interacción</h2>
            <div className="mt-4"><FormularioInteraccion clienteId={cliente.id} /></div>
          </section>
          <section className="rounded-xl border border-line p-4 sm:p-5">
            <h2 className="font-semibold">Historial</h2>
            {interacciones.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Todavía no hay llamadas, reuniones ni correos registrados.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-4">
                {interacciones.map((i) => (
                  <li key={i.id} className="flex gap-3">
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      {i.type === "llamada" ? <Phone className="size-4" aria-hidden /> : i.type === "email" ? <Mail className="size-4" aria-hidden /> : <CalendarClock className="size-4" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{TIPOS_INTERACCION[i.type]}</span>
                        <span className="text-ink-soft"> · {formatoFecha.format(new Date(i.date))} · {i.autor?.name || i.autor?.email || "—"}</span>
                      </p>
                      <p className="mt-1 text-sm break-words whitespace-pre-line">{i.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {activa === "pedidos" && (
        <section className="mt-6 rounded-xl border border-line p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Pedidos de este cliente</h2>
              {comprado > 0 && (
                <p className="mt-1 text-sm text-ink-soft">
                  Completados: <span className="font-semibold text-ink tabular-nums">{pesos(comprado)}</span> (IVA incluido)
                </p>
              )}
            </div>
            <div className="w-full sm:w-48">
              <BotonCrearPedido clienteId={cliente.id} />
            </div>
          </div>
          {pedidos.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <ClipboardList className="mx-auto size-10 text-ink-soft" aria-hidden />
              <p className="mt-3 text-sm text-ink-soft">Todavía no tiene pedidos. Crea el primero con &quot;Crear pedido&quot;.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {pedidos.map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:bg-mist/40 sm:px-2">
                    <span className="font-semibold tabular-nums">#{p.number}</span>
                    <InsigniaPedido estado={p.status} />
                    <span className="text-sm text-ink-soft">
                      {formatoDia.format(new Date(p.created_at))} · {p.productos} {p.productos === 1 ? "producto" : "productos"} ·{" "}
                      {p.vendedor?.name || p.vendedor?.email || "—"}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">{pesos(p.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Contact, FileText, PartyPopper, ShieldCheck, Store } from "lucide-react";
import { ContactosCliente } from "@/components/clientes/contactos";
import { DocumentosCliente } from "@/components/clientes/documentos";
import { FormularioEmpresa, SugerenciasCiudades } from "@/components/clientes/formulario-empresa";
import { InsigniaEstado, documentosCompletos } from "@/components/clientes/insignias";
import { SedesCliente } from "@/components/clientes/sedes";
import { ValidacionCliente } from "@/components/clientes/validacion";
import { enlacesFirmados, obtenerCliente } from "@/lib/clientes/datos";
import { CIUDADES_SUGERIDAS } from "@/lib/clientes/opciones";

export const metadata: Metadata = { title: "Actualizar información" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> };

function Seccion({
  titulo,
  icono: Icono,
  descripcion,
  children,
}: {
  titulo: string;
  icono: typeof Building2;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icono className="size-5 text-brand" aria-hidden />
        {titulo}
      </h2>
      {descripcion && <p className="mt-1 text-sm text-ink-soft">{descripcion}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function EditarCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const enlaces = await enlacesFirmados([
    cliente.photo_url,
    cliente.rut_doc_url,
    cliente.camara_comercio_url,
    cliente.tratamiento_datos_url,
    ...cliente.sedes.map((s) => s.photo_url),
  ]);

  const puntos = [
    { texto: "Datos de la empresa (razón social, NIT y ciudad)", listo: Boolean(cliente.name && cliente.nit_rut && cliente.city) },
    { texto: "Cámara de Comercio, RUT y Tratamiento de datos", listo: documentosCompletos(cliente) },
    { texto: "Al menos una sede", listo: cliente.sedes.length > 0 },
    { texto: "Al menos un contacto", listo: cliente.contactos.length > 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/clientes" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          Volver a clientes
        </Link>
        <Link href={`/clientes/${cliente.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
          Ver ficha del cliente
        </Link>
      </div>

      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Actualizar información</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-base text-ink-soft">
        <span className="font-semibold text-ink">{cliente.name}</span>
        {cliente.nit_rut && <span className="tabular-nums">· {cliente.nit_rut}</span>}
        <InsigniaEstado estado={cliente.status} />
      </p>

      {nuevo && (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm text-ink">
          <PartyPopper className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          Empresa creada. Ahora sube sus documentos y agrega sus sedes y contactos.
        </p>
      )}

      <SugerenciasCiudades ciudades={CIUDADES_SUGERIDAS} />

      <div className="mt-8 flex flex-col gap-6">
        <Seccion titulo="Datos de la empresa" icono={Building2}>
          <FormularioEmpresa cliente={cliente} />
        </Seccion>

        <Seccion titulo="Documentos" icono={FileText} descripcion="PDF o foto, máximo 10 MB. Solo los ve tu equipo.">
          <DocumentosCliente
            clienteId={cliente.id}
            rutas={{
              camara_comercio_url: cliente.camara_comercio_url,
              rut_doc_url: cliente.rut_doc_url,
              tratamiento_datos_url: cliente.tratamiento_datos_url,
              photo_url: cliente.photo_url,
            }}
            enlaces={enlaces}
          />
        </Seccion>

        <Seccion titulo={`Sedes (${cliente.sedes.length})`} icono={Store}>
          <SedesCliente clienteId={cliente.id} sedes={cliente.sedes} enlaces={enlaces} />
        </Seccion>

        <Seccion titulo={`Contactos (${cliente.contactos.length})`} icono={Contact}>
          <ContactosCliente clienteId={cliente.id} contactos={cliente.contactos} sedes={cliente.sedes} />
        </Seccion>

        <Seccion titulo="Validación de información" icono={ShieldCheck} descripcion="Cuando todo esté completo, marca el cliente como validado.">
          <ValidacionCliente clienteId={cliente.id} estado={cliente.status} puntos={puntos} />
        </Seccion>
      </div>
    </div>
  );
}

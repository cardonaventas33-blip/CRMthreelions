"use client";

import {
  BotonEnviar,
  Campo,
  CampoArea,
  CampoLista,
  Mensaje,
  useFormularioAccion,
} from "@/components/formulario";
import { actualizarCliente, crearCliente } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { ClienteDetalle } from "@/lib/clientes/datos";
import { PLAZOS, TIPOS_NEGOCIO } from "@/lib/clientes/opciones";

type DatosEmpresa = Pick<
  ClienteDetalle,
  | "id"
  | "name"
  | "nit_rut"
  | "trade_name"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "business_type"
  | "employees"
  | "payment_term_days"
  | "notes"
>;

const opcionesTipo = TIPOS_NEGOCIO.map((t) => ({ valor: t, nombre: t }));
const opcionesPlazo = PLAZOS.map((p) => ({ valor: String(p.dias), nombre: p.nombre }));

// Sugerencias de ciudades (se pone una sola vez por página)
export function SugerenciasCiudades({ ciudades }: { ciudades: readonly string[] }) {
  return (
    <datalist id="ciudades-sugeridas">
      {ciudades.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
  );
}

export function FormularioEmpresa({ cliente }: { cliente?: DatosEmpresa }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(
    cliente ? actualizarCliente : crearCliente,
    {},
  );

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <Campo
        id="emp-razon"
        etiqueta="Razón social *"
        name="name"
        defaultValue={cliente?.name}
        maxLength={200}
        autoComplete="organization"
        required
      />
      <Campo
        id="emp-nit"
        etiqueta="NIT o cédula *"
        name="nit_rut"
        defaultValue={cliente?.nit_rut ?? ""}
        inputMode="numeric"
        maxLength={25}
        required
        ayuda="Solo números. El dígito de verificación va con guion: 900123456-7"
      />
      <Campo
        id="emp-comercial"
        etiqueta="Nombre comercial"
        name="trade_name"
        defaultValue={cliente?.trade_name ?? ""}
        maxLength={200}
      />
      <Campo
        id="emp-correo"
        etiqueta="Correo de facturación"
        name="email"
        type="email"
        inputMode="email"
        defaultValue={cliente?.email ?? ""}
        maxLength={200}
      />
      <Campo
        id="emp-telefono"
        etiqueta="Teléfono"
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={cliente?.phone ?? ""}
        maxLength={30}
      />
      <Campo
        id="emp-ciudad"
        etiqueta="Ciudad *"
        name="city"
        list="ciudades-sugeridas"
        defaultValue={cliente?.city ?? ""}
        maxLength={80}
        autoComplete="off"
        required
      />
      <div className="md:col-span-2">
        <Campo
          id="emp-direccion"
          etiqueta="Dirección"
          name="address"
          defaultValue={cliente?.address ?? ""}
          maxLength={300}
          placeholder="Cra 5 # 60-235, barrio"
        />
      </div>
      <CampoLista
        id="emp-tipo"
        etiqueta="Tipo de negocio"
        name="business_type"
        opciones={opcionesTipo}
        vacio="Elige…"
        defaultValue={cliente?.business_type ?? ""}
      />
      <Campo
        id="emp-empleados"
        etiqueta="Empleados totales"
        name="employees"
        inputMode="numeric"
        defaultValue={cliente?.employees?.toString() ?? ""}
        maxLength={6}
      />
      <CampoLista
        id="emp-plazo"
        etiqueta="Plazo de pago"
        name="payment_term_days"
        opciones={opcionesPlazo}
        defaultValue={String(cliente?.payment_term_days ?? 0)}
      />
      <div className="md:col-span-2">
        <CampoArea
          id="emp-observaciones"
          etiqueta="Observaciones"
          name="notes"
          defaultValue={cliente?.notes ?? ""}
          maxLength={2000}
        />
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="md:self-start">
          {cliente ? "Guardar datos de la empresa" : "Crear empresa"}
        </BotonEnviar>
      </div>
    </form>
  );
}

"use client";

import {
  BotonEnviar,
  Campo,
  CampoArea,
  CampoLista,
  Mensaje,
  useFormularioAccion,
} from "@/components/formulario";
import { guardarProducto } from "@/lib/acciones/productos";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { Producto } from "@/lib/catalogo/datos";
import { CATEGORIAS } from "@/lib/catalogo/opciones";

const opcionesCategoria = Object.entries(CATEGORIAS).map(([valor, nombre]) => ({ valor, nombre }));
const miles = new Intl.NumberFormat("es-CO");

export function FormularioProducto({ producto }: { producto?: Producto }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarProducto, {});

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {producto && <input type="hidden" name="id" value={producto.id} />}
      <CampoLista id="prod-categoria" etiqueta="Categoría *" name="category" opciones={opcionesCategoria} defaultValue={producto?.category ?? "plumillas"} />
      <Campo id="prod-sku" etiqueta="Código (SKU) *" name="sku" defaultValue={producto?.sku ?? ""} maxLength={60} autoComplete="off" required ayuda="Ej.: PLU-SIL-16. Se guarda en mayúsculas y no se puede repetir." />
      <Campo id="prod-linea" etiqueta="Línea" name="line" defaultValue={producto?.line ?? ""} maxLength={120} placeholder="Ej.: Plumilla Siliconada" ayuda="Agrupa las medidas de un mismo producto." />
      <Campo id="prod-medida" etiqueta="Medida" name="size" defaultValue={producto?.size ?? ""} maxLength={20} placeholder={'Ej.: 16"'} />
      <div className="md:col-span-2">
        <Campo id="prod-nombre" etiqueta="Nombre" name="name" defaultValue={producto?.name ?? ""} maxLength={200} ayuda="Si lo dejas vacío, se arma con la línea y la medida." />
      </div>
      <Campo id="prod-marca" etiqueta="Marca" name="brand" defaultValue={producto?.brand ?? ""} maxLength={60} placeholder="Ej.: IMCOV" />
      <Campo id="prod-precio" etiqueta="Precio con IVA (pesos) *" name="price" inputMode="numeric" defaultValue={producto ? miles.format(producto.price) : ""} maxLength={15} required placeholder="25.000" />
      <Campo id="prod-stock" etiqueta="Stock (unidades) *" name="stock" inputMode="numeric" defaultValue={producto?.stock?.toString() ?? "0"} maxLength={7} required />
      <label htmlFor="prod-activo" className="flex min-h-12 cursor-pointer items-center gap-2 self-end text-sm font-medium">
        <input id="prod-activo" type="checkbox" name="active" defaultChecked={producto?.active ?? true} className="size-5 accent-brand" />
        Activo (se puede vender)
      </label>
      <div className="md:col-span-2">
        <CampoArea id="prod-descripcion" etiqueta="Descripción" name="description" defaultValue={producto?.description ?? ""} maxLength={2000} />
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="md:self-start">
          {producto ? "Guardar producto" : "Crear producto"}
        </BotonEnviar>
      </div>
    </form>
  );
}

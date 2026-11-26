import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Páginas que se pueden ver sin iniciar sesión
const RUTAS_PUBLICAS = ["/login"];

// Se ejecuta antes de cada página: renueva la sesión y manda a "/login"
// a quien no ha iniciado sesión.
export async function middleware(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGuardar, cabeceras) {
          cookiesParaGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesParaGuardar.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
          Object.entries(cabeceras).forEach(([clave, valor]) =>
            respuesta.headers.set(clave, valor),
          );
        },
      },
    },
  );

  // Importante: no poner código entre crear el cliente y esta línea
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);

  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));

  if (!conSesion && !esPublica) return redirigir(request, respuesta, "/login");
  if (conSesion && ruta === "/login") return redirigir(request, respuesta, "/");
  return respuesta;
}

// Redirige sin perder las cookies de sesión recién renovadas
function redirigir(request: NextRequest, respuesta: NextResponse, destino: string) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  const redireccion = NextResponse.redirect(url);
  respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  for (const clave of ["cache-control", "expires", "pragma"]) {
    const valor = respuesta.headers.get(clave);
    if (valor) redireccion.headers.set(clave, valor);
  }
  return redireccion;
}

export const config = {
  matcher: [
    // Todo menos los archivos fijos (imágenes, íconos y los de Next)
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

// Respuesta de los formularios: un aviso de éxito o un error para mostrar
export type EstadoAccion = { ok?: string; error?: string };

// El formulario de entrada además recuerda el correo si algo sale mal
export type EstadoLogin = EstadoAccion & { correo?: string };

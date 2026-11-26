# Guarda las 3 claves de Supabase en .env.local SIN mostrarlas en pantalla.
# Uso (en PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File scripts\guardar-claves.ps1
$ErrorActionPreference = 'Stop'
$archivo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.env.local'))

function Read-Oculto([string]$mensaje) {
  $seguro = Read-Host -Prompt $mensaje -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host ''
Write-Host 'Vamos a guardar las 3 claves de Supabase.' -ForegroundColor Cyan
Write-Host 'Lo que pegues NO se ve en pantalla (solo salen asteriscos). Es normal.' -ForegroundColor Cyan
Write-Host 'Para pegar: Ctrl + V o clic derecho. Despues presiona Enter.' -ForegroundColor Cyan
Write-Host ''

$url = Read-Oculto '1 de 3 - Pega la Project URL (https://...supabase.co)'
$pub = Read-Oculto '2 de 3 - Pega la Publishable key (sb_publishable_...)'
$sec = Read-Oculto '3 de 3 - Pega la Secret key (sb_secret_...)'

$contenido = @"
# ============================================================
# Claves del CRM Three Lions. ESTE ARCHIVO ES SECRETO.
# No se sube a GitHub (esta en .gitignore). No lo compartas.
# ============================================================

# 1) Direccion de tu proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=$url

# 2) Clave publicable (sb_publishable_... o la antigua "anon")
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$pub

# 3) Clave secreta (sb_secret_... o la antigua "service_role"). SOLO servidor.
SUPABASE_SECRET_KEY=$sec
"@

[IO.File]::WriteAllText($archivo, $contenido, (New-Object System.Text.UTF8Encoding $false))
$url = $null; $pub = $null; $sec = $null

Write-Host ''
Write-Host 'Guardado. Ahora compruebo que funcionan (sin mostrarlas):' -ForegroundColor Cyan
Write-Host ''
& node (Join-Path $PSScriptRoot 'verificar-supabase.mjs') $archivo
Write-Host ''
Write-Host 'Listo. Ya puedes volver al chat.' -ForegroundColor Green

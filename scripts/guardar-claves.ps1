# Guarda las claves de Supabase en .env.local. Solo pide las que faltan.
# La Secret key se escribe sin mostrarse en pantalla.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\guardar-claves.ps1
$ErrorActionPreference = 'Stop'
$archivo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.env.local'))

# Lo que ya esta guardado
$actual = @{}
if (Test-Path -LiteralPath $archivo) {
  foreach ($linea in Get-Content -LiteralPath $archivo) {
    if ($linea -match '^\s*([A-Z_]+)\s*=\s*(.*)$') { $actual[$Matches[1]] = $Matches[2].Trim() }
  }
}

function Read-Oculto([string]$mensaje) {
  $seguro = Read-Host -Prompt $mensaje -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host ''
Write-Host '=== Claves de Supabase para el CRM Three Lions ===' -ForegroundColor Cyan
Write-Host 'Para pegar: clic derecho o Ctrl + V. Despues presiona Enter.' -ForegroundColor Cyan
Write-Host ''

$url = $actual['NEXT_PUBLIC_SUPABASE_URL']
if ($url) { Write-Host 'Project URL: ya estaba guardada.' -ForegroundColor Green }
else { $url = (Read-Host -Prompt 'Pega la Project URL (empieza por https:// y termina en .supabase.co)').Trim() }

$pub = $actual['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
if ($pub) { Write-Host 'Publishable key: ya estaba guardada.' -ForegroundColor Green }
else { $pub = (Read-Host -Prompt 'Pega la Publishable key (empieza por sb_publishable_)').Trim() }

$sec = $actual['SUPABASE_SECRET_KEY']
if ($sec) { Write-Host 'Secret key: ya estaba guardada.' -ForegroundColor Green }
else {
  Write-Host ''
  Write-Host 'La Secret key NO se ve al pegarla (solo salen asteriscos). Es normal.' -ForegroundColor Yellow
  $sec = Read-Oculto 'Pega la Secret key (empieza por sb_secret_)'
}

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
Read-Host -Prompt 'Presiona Enter para cerrar esta ventana' | Out-Null

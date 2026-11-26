# Crea tu usuario ADMINISTRADOR del CRM. La contrasena no se ve al escribirla
# y no se guarda en ningun archivo.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\crear-admin.ps1
$ErrorActionPreference = 'Stop'
$raiz = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Read-Oculto([string]$mensaje) {
  $seguro = Read-Host -Prompt $mensaje -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host ''
Write-Host '=== Crear tu usuario ADMINISTRADOR del CRM Three Lions ===' -ForegroundColor Cyan
Write-Host ''

$correo = (Read-Host -Prompt 'Tu correo (con el que vas a entrar al CRM)').Trim()
$nombre = (Read-Host -Prompt 'Tu nombre completo').Trim()

Write-Host ''
Write-Host 'Ahora tu contrasena. NO se ve al escribirla (solo asteriscos). Es normal.' -ForegroundColor Yellow
do {
  $clave = Read-Oculto 'Inventa una contrasena (minimo 8 caracteres)'
  $clave2 = Read-Oculto 'Escribela otra vez'
  $valida = ($clave.Length -ge 8) -and ($clave -ceq $clave2)
  if (-not $valida) { Write-Host 'No coinciden o tiene menos de 8 caracteres. Intenta otra vez.' -ForegroundColor Yellow }
} until ($valida)

$env:CRM_ADMIN_CORREO = $correo
$env:CRM_ADMIN_NOMBRE = $nombre
$env:CRM_ADMIN_CLAVE = $clave
$clave = $null; $clave2 = $null

try {
  Push-Location $raiz
  & node (Join-Path $PSScriptRoot 'crear-admin.mjs')
}
finally {
  Pop-Location
  Remove-Item Env:CRM_ADMIN_CORREO, Env:CRM_ADMIN_NOMBRE, Env:CRM_ADMIN_CLAVE -ErrorAction SilentlyContinue
}

Write-Host ''
Read-Host -Prompt 'Presiona Enter para cerrar esta ventana' | Out-Null

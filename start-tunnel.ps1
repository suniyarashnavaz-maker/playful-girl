$ErrorActionPreference = 'Stop'
$log  = 'C:\Users\s.rashnavaz\Desktop\PixelDen\bin\tunnel.log'
$exe  = 'C:\Users\s.rashnavaz\Desktop\PixelDen\bin\cloudflared.exe'

# kill stale tunnels
foreach ($p in Get-Process cloudflared -ErrorAction SilentlyContinue) { Stop-Process -Id $p.Id -Force }
if (Test-Path $log) { Remove-Item $log }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $exe
$psi.Arguments = "tunnel --url http://localhost:4801 --logfile `"$log`""
$psi.WorkingDirectory = 'C:\Users\s.rashnavaz\Desktop\PixelDen'
$psi.UseShellExecute = $false
$p = [System.Diagnostics.Process]::Start($psi)

$url = $null
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep 2
  if (-not $p.HasExited -and (Test-Path $log)) {
    $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($m) { $url = ($m.Line -replace '.*?(https://[a-z0-9-]+\.trycloudflare\.com).*','$1'); break }
  }
}
if (-not $url) { Write-Host 'FAILED TO GET URL'; Get-Content $log -Tail 5; exit 1 }
Write-Host $url

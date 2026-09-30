$ErrorActionPreference = 'SilentlyContinue'
foreach ($p in (Get-CimInstance Win32_Process -Filter "Name='node.exe'")) {
  if ($p.CommandLine -match 'server\.mjs') { Stop-Process -Id $p.ProcessId; Write-Host "killed $($p.ProcessId)" }
}
# wait for the port to actually release
for ($i = 0; $i -lt 30; $i++) {
  $inUse = Get-NetTCPConnection -LocalPort 4801 -State Listen -ErrorAction SilentlyContinue
  if (-not $inUse) { break }
  Start-Sleep 1
}
$p = $null
for ($try = 0; $try -lt 5; $try++) {
  $p = Start-Process node -ArgumentList 'server.mjs' -WorkingDirectory 'C:\Users\s.rashnavaz\Desktop\PixelDen' -PassThru -WindowStyle Hidden
  Start-Sleep 2
  if (-not $p.HasExited) { break }
  Start-Sleep 1
}
Start-Sleep 1
foreach ($u in '/','/game.html?id=tetris','/css/style.css','/js/main.js','/js/player.js','/js/coverart.js','/api/stats') {
  $c = [int](Invoke-WebRequest ("http://localhost:4801" + $u) -UseBasicParsing).StatusCode
  Write-Host "$c $u"
}

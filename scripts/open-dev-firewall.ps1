# Run this script as Administrator to allow phones on your Wi-Fi to reach the dev server.
# Right-click PowerShell -> Run as administrator, then:
#   cd path\to\project
#   npm run dev:firewall

$ErrorActionPreference = "Stop"
$ruleName = "Switchboard Next.js Dev"
$port = 3000

Write-Host "Configuring Windows Firewall for Next.js on TCP $port..."

# Remove any older rule so profile/port settings stay correct
netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

# Many home Wi‑Fi networks are classified as Public in Windows.
# Allow inbound TCP 3000 on Private and Public so LAN devices can connect.
netsh advfirewall firewall add rule `
  name="$ruleName" `
  dir=in `
  action=allow `
  protocol=TCP `
  localport=$port `
  profile=private,public `
  enable=yes `
  description="Allow phones/other devices on LAN to reach Switchboard Next.js dev server"

if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed. Re-run PowerShell as Administrator."
  exit 1
}

$lanIp = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -like "192.168.*" -or
      $_.IPAddress -like "10.*" -or
      ($_.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.')
    } |
    Sort-Object -Property InterfaceMetric |
    Select-Object -ExpandProperty IPAddress -First 1
)

Write-Host ""
Write-Host "Firewall rule added for TCP port $port (Private + Public)."
if ($lanIp) {
  Write-Host "On your phone open: http://${lanIp}:${port}"
} else {
  Write-Host "On your phone open: http://<your-pc-wifi-ip>:${port}"
}
Write-Host "Then restart the app with: npm run dev"
Write-Host ""

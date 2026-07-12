# Run this script as Administrator to allow phones on your Wi-Fi to reach the dev server.
# Right-click PowerShell -> Run as administrator, then:
#   cd path\to\project
#   npm run dev:firewall

$ruleName = "Switchboard Next.js Dev"

# Remove any older rule so profile/port settings stay correct
netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

# Many home Wi‑Fi networks are classified as Public in Windows.
# Allow inbound TCP 3000 on Private and Public so LAN devices can connect.
netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=3000 profile=private,public
if ($LASTEXITCODE -eq 0) {
  Write-Host "Added firewall rule for TCP port 3000 (Private + Public networks)."
  Write-Host "On your phone open: http://$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1).IPAddress):3000"
} else {
  Write-Host "Failed. Re-run PowerShell as Administrator."
  exit 1
}

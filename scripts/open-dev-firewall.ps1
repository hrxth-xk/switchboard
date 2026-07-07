# Run this script as Administrator to allow phones on your Wi-Fi to reach the dev server.
# Right-click PowerShell -> Run as administrator, then:
#   cd path\to\project
#   npm run dev:firewall

$ruleName = "Switchboard Next.js Dev"

$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Firewall rule '$ruleName' already exists."
  exit 0
}

netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=3000 profile=private
if ($LASTEXITCODE -eq 0) {
  Write-Host "Added firewall rule for TCP port 3000 (Private networks)."
  Write-Host "Restart npm run dev, then open the Phone URL shown in the terminal."
} else {
  Write-Host "Failed. Re-run PowerShell as Administrator."
  exit 1
}

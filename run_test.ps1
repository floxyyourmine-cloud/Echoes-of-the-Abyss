$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$url = "file:///" + ($PSScriptRoot.Replace('\', '/')) + "/test_runner.html"
$proc = Start-Process -FilePath $chrome -ArgumentList @("--headless", "--disable-gpu", "--allow-file-access-from-files", "--dump-dom", "`"$url`"") -RedirectStandardOutput "$PSScriptRoot\test_out.txt" -RedirectStandardError "$PSScriptRoot\test_err.txt" -PassThru -Wait
if (Test-Path "$PSScriptRoot\test_out.txt") {
    $c = Get-Content "$PSScriptRoot\test_out.txt" -Raw
    if ($c -match '<div id="test-results">([\s\S]*?)<\/div>') {
        Write-Host "=== TEST RESULTS ==="
        Write-Host $matches[1]
    }
}

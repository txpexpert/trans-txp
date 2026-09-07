cd C:\Users\hp\Desktop\trans-txp
$files = git diff --name-only

foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $text = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($f, $text, $utf8NoBom)
        Write-Host "BOM retire : $f"
    }
}

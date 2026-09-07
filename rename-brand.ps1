cd C:\Users\hp\Desktop\trans-txp

$sourceDirs = @(".\components", ".\pages", ".\lib", ".\content", ".\context", ".\styles")
$extensions = @("*.tsx","*.ts","*.jsx","*.js","*.html")
$emdash = [char]0x2014

$replacements = @(
    ,@("TRANSIT-EXPERT", "IMPORT-EXPERT")
    ,@("Transit-eXPert", "Import-eXPert")
    ,@("Transit-IA", "Import-IA")
    ,@("Transit.ia", "Import.ia")
    ,@("Transit<em>-</em>IA", "Import<em>-</em>IA")
    ,@(("TRANSIT<br>" + $emdash + "<br>IA"), ("IMPORT<br>" + $emdash + "<br>IA"))
)

foreach ($dir in $sourceDirs) {
    if (Test-Path $dir) {
        Get-ChildItem -Path $dir -Recurse -Include $extensions -ErrorAction SilentlyContinue | ForEach-Object {
            $content = Get-Content $_.FullName -Raw -Encoding UTF8
            $original = $content
            foreach ($pair in $replacements) {
                $content = $content -replace [regex]::Escape($pair[0]), $pair[1]
            }
            if ($content -ne $original) {
                Set-Content -Path $_.FullName -Value $content -NoNewline -Encoding UTF8
                Write-Host "Modifie : $($_.FullName)"
            }
        }
    }
}


Write-Host "Termine."

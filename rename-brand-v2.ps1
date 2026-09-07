cd C:\Users\hp\Desktop\trans-txp

$sourceDirs = @(".\components", ".\pages", ".\lib", ".\content", ".\context", ".\styles")
$extensions = @("*.tsx","*.ts","*.jsx","*.js","*.html")
$emdash = [char]0x2014
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

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
            $path = $_.FullName
            $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
            $original = $content
            foreach ($pair in $replacements) {
                $content = $content -replace [regex]::Escape($pair[0]), $pair[1]
            }
            if ($content -ne $original) {
                [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
                Write-Host "Modifie : $path"
            }
        }
    }

}

Write-Host "Termine."

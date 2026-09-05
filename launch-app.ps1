$exe = Join-Path (Get-Location) 'release-builds\win-unpacked\Aegis Network IDS.exe'
if (!(Test-Path $exe)) { Write-Output 'EXE MISSING'; exit 1 }
$proc = Start-Process -FilePath $exe -WorkingDirectory (Get-Location) -RedirectStandardOutput 'packaged-run.log' -RedirectStandardError 'packaged-err.log' -PassThru
Write-Output ('STARTED PID=' + $proc.ProcessId)
param([Parameter(Mandatory=$true)][ValidateSet('Start','Stop')][string]$Action)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDir = Join-Path $projectRoot '.runtime-windows'
$stateFile = Join-Path $runtimeDir 'state.json'
$serviceName = 'MariaDB'
$serviceConfig = 'D:\DevTools\MariaDB\data\my.ini'

# Service control requires elevation; retain the project path even when launched elsewhere.
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        $elevated = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Verb RunAs -WindowStyle Normal -Wait -PassThru -ArgumentList @('-NoProfile','-File',('"{0}"' -f $PSCommandPath),'-Action',$Action)
        exit $elevated.ExitCode
    } catch { Write-Host 'Administrator access was not granted. No services were changed.'; exit 1 }
}

$hash = [Security.Cryptography.SHA256]::Create()
$key = [BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant()))).Replace('-','')
$hash.Dispose()
$mutex = [Threading.Mutex]::new($false, "Local\WWT-$key")
$locked = $false
$state = $null
$newProcesses = @()
$startedDatabase = $false

function Save-State {
    $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8
}

function Get-TrackedProcess($entry) {
    if ($null -eq $entry) { return $null }
    $allowedEntries = @((Join-Path $projectRoot 'backend_node\index.js'), (Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'))
    if ($entry.Entry -notin $allowedEntries -or (Split-Path $entry.Executable -Leaf) -ne 'node.exe') {
        throw 'Invalid recorded project process identity.'
    }
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$entry.Pid)"
    if ($null -eq $proc) { return $null }
    if ($proc.CreationDate.ToUniversalTime().ToString('o') -ne $entry.CreatedUtc -or
        $proc.ExecutablePath -ne $entry.Executable -or
        -not $proc.CommandLine.Contains(('"{0}"' -f $entry.Entry))) {
        throw "PID $($entry.Pid) no longer identifies the recorded project process. Refusing to manage it."
    }
    return $proc
}

function Stop-TrackedProcess($entry) {
    $proc = Get-TrackedProcess $entry
    if ($null -eq $proc) { return }
    # Capture descendants before stopping Vite so its esbuild helper is also stopped.
    $all = @(Get-CimInstance Win32_Process)
    $tree = @($proc)
    for ($i=0; $i -lt $tree.Count; $i++) {
        $parent = $tree[$i]
        $tree += @($all | Where-Object { $_.ParentProcessId -eq $parent.ProcessId -and $_.CreationDate -ge $parent.CreationDate })
    }
    [array]::Reverse($tree)
    foreach ($item in $tree) {
        $current = Get-CimInstance Win32_Process -Filter "ProcessId=$($item.ProcessId)"
        if ($current -and $current.CreationDate -eq $item.CreationDate) {
            Stop-Process -Id $item.ProcessId -ErrorAction Stop
        }
    }
}

function Stop-Database {
    $service = Get-Service -Name $serviceName
    if ($service.Status -ne 'Stopped') {
        Stop-Service -Name $serviceName -ErrorAction Stop
        (Get-Service -Name $serviceName).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    }
}

function Wait-Http([string]$url, $entry, [bool]$backend) {
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        if (-not (Get-TrackedProcess $entry)) { throw "Project process exited. Check logs in $runtimeDir" }
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                if (-not $backend) { return }
                $body = $response.Content | ConvertFrom-Json
                if ($body.code -eq 0 -and $body.message -eq 'success') { return }
            }
        } catch { }
        Start-Sleep -Milliseconds 300
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "HTTP readiness timed out: $url. Check logs in $runtimeDir"
}

try {
    try { $locked = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) { throw 'Another start/stop operation is already running.' }
    $serviceInfo = Get-CimInstance Win32_Service -Filter "Name='$serviceName'"
    if (-not $serviceInfo -or -not $serviceInfo.PathName.Contains($serviceConfig)) {
        throw 'The configured local MariaDB service was not found or points to another installation.'
    }
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    if (Test-Path -LiteralPath $stateFile) {
        $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
        if ($state.Root -ne $projectRoot) { throw 'Runtime state belongs to another checkout.' }
    } else { $state = [pscustomobject]@{Root=$projectRoot; Backend=$null; Frontend=$null} }

    if ($Action -eq 'Stop') {
        # Validate both identities before stopping anything.
        $null = Get-TrackedProcess $state.Frontend
        $null = Get-TrackedProcess $state.Backend
        Stop-TrackedProcess $state.Frontend
        $state.Frontend = $null
        Save-State
        Stop-TrackedProcess $state.Backend
        $state.Backend = $null
        Save-State
        Stop-Database
        Write-Host 'Stopped: project frontend, backend and MariaDB.'
    } else {
        $node = (Get-Command node.exe -ErrorAction Stop).Source
        # Use an explicit path across UAC contexts; never fall back to source credentials.
        $configPath = Join-Path $runtimeDir 'db.local.json'
        if (-not (Test-Path -LiteralPath $configPath)) {
            $configPath = Join-Path $env:LOCALAPPDATA 'WutheringWavesTool\db.local.json'
        }
        if (-not (Test-Path -LiteralPath $configPath)) { throw "Private database configuration missing: $configPath" }
        $env:WWT_DB_CONFIG = $configPath
        Write-Host "Using private DB config: $configPath"
        $specs = @(
            @{Name='Backend'; Port=3000; Entry=(Join-Path $projectRoot 'backend_node\index.js'); Work=(Join-Path $projectRoot 'backend_node'); Args=''; Url='http://localhost:3000/api/readRecords'},
            @{Name='Frontend'; Port=5173; Entry=(Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'); Work=(Join-Path $projectRoot 'frontend'); Args=' --host 127.0.0.1 --port 5173 --strictPort'; Url='http://127.0.0.1:5173/'}
        )
        if (-not (Test-Path (Join-Path $projectRoot 'backend_node\node_modules\mysql2'))) { throw 'Run npm ci in backend_node first.' }
        foreach ($spec in $specs) {
            if (-not (Test-Path -LiteralPath $spec.Entry)) { throw "Missing $($spec.Entry). Run npm ci in frontend first if needed." }
            $existing = Get-TrackedProcess $state.($spec.Name)
            $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $spec.Port -ErrorAction SilentlyContinue)
            if ($listeners | Where-Object { -not $existing -or $_.OwningProcess -ne $existing.ProcessId }) {
                throw "Port $($spec.Port) is occupied by an untracked process. It has not been stopped."
            }
        }
        $service = Get-Service -Name $serviceName
        if ($service.Status -ne 'Running') {
            Write-Host 'Starting MariaDB...'
            Start-Service -Name $serviceName
            $startedDatabase = $true
            (Get-Service -Name $serviceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
        }
        # Use the real project configuration without copying credentials or player records.
        $dbPath = Join-Path $projectRoot 'backend_node\utils\db.js'
        $dbCheck = "const db=require(process.argv[1]);db.pool.query('SELECT 1').catch(e=>{console.error(e.code||'DB_CONNECTION_FAILED');process.exitCode=1}).finally(()=>db.pool.end());"
        & $node -e $dbCheck $dbPath
        if ($LASTEXITCODE -ne 0) { throw 'Project database connection failed.' }
        foreach ($spec in $specs) {
            if (-not (Get-TrackedProcess $state.($spec.Name))) {
                $proc = Start-Process -FilePath $node -WorkingDirectory $spec.Work -ArgumentList (('"{0}"' -f $spec.Entry)+$spec.Args) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir "$($spec.Name).stdout.log") -RedirectStandardError (Join-Path $runtimeDir "$($spec.Name).stderr.log") -PassThru
                $info = Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)"
                if (-not $info) { throw "$($spec.Name) exited immediately." }
                $entry = [pscustomobject]@{Pid=$proc.Id; CreatedUtc=$info.CreationDate.ToUniversalTime().ToString('o'); Executable=$node; Entry=$spec.Entry}
                $state.($spec.Name) = $entry
                $newProcesses += $spec.Name
                Save-State
            }
            Wait-Http $spec.Url $state.($spec.Name) ($spec.Name -eq 'Backend')
        }
        Write-Host 'Ready: http://127.0.0.1:5173/ (backend: http://localhost:3000)'
        Write-Host "Logs: $runtimeDir"
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    # Roll back only resources started by this invocation.
    if ($Action -eq 'Start' -and $state) {
        [array]::Reverse($newProcesses)
        foreach ($name in $newProcesses) {
            try { Stop-TrackedProcess $state.($name); $state.($name)=$null; Save-State } catch { Write-Host "Cleanup failed for $name" }
        }
        if ($startedDatabase) { try { Stop-Database } catch { Write-Host 'MariaDB cleanup failed.' } }
    }
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}

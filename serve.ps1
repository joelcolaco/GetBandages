$listener = New-Object System.Net.HttpListener
$prefix = 'http://localhost:8000/'
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Output "Serving $PWD at $prefix"
while ($true) {
    $context = $listener.GetContext()
    $req = $context.Request
    $path = $req.Url.LocalPath.TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path (Get-Location) $path
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $resp = $context.Response
        switch ([System.IO.Path]::GetExtension($file)) {
            '.html' { $resp.ContentType = 'text/html' }
            '.js'   { $resp.ContentType = 'application/javascript' }
            '.css'  { $resp.ContentType = 'text/css' }
            '.png'  { $resp.ContentType = 'image/png' }
            '.jpg'  { $resp.ContentType = 'image/jpeg' }
            '.json' { $resp.ContentType = 'application/json' }
            '.svg'  { $resp.ContentType = 'image/svg+xml' }
            default { $resp.ContentType = 'application/octet-stream' }
        }
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
        $resp.OutputStream.Close()
    } else {
        $context.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        $context.Response.OutputStream.Write($msg, 0, $msg.Length)
        $context.Response.OutputStream.Close()
    }
}
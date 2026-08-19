$source = "C:\Users\CSE\Downloads\reverse-tech-contact-services-orders-fixed\.env"
$destination = Join-Path $PSScriptRoot ".env"
Copy-Item $source $destination -Force
Write-Host "تم نقل ملف .env إلى النسخة النهائية بنجاح." -ForegroundColor Green

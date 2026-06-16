Write-Host "Generando deploy.zip para Elastic Beanstalk..."

mvn package -DskipTests -q

New-Item -ItemType Directory -Force -Path "target\eb-deploy" | Out-Null
Copy-Item "target\fertilar-service-0.0.1-SNAPSHOT.jar" "target\eb-deploy\fertilar-service-0.0.1-SNAPSHOT.jar" -Force
Copy-Item "Procfile" "target\eb-deploy\Procfile" -Force
Compress-Archive -Force -Path "target\eb-deploy\fertilar-service-0.0.1-SNAPSHOT.jar","target\eb-deploy\Procfile" -DestinationPath "target\deploy.zip"

$size = [math]::Round((Get-Item "target\deploy.zip").Length / 1MB, 1)
Write-Host "deploy.zip listo: $size MB → target\deploy.zip"

# FertilAR Service

API REST de FertilAR. Spring Boot 3.3, Java 17, PostgreSQL, AWS Cognito y S3.

## Requisitos

- [JDK 17](https://adoptium.net/)
- [Maven 3.9+](https://maven.apache.org/)
- Acceso a la base PostgreSQL (RDS en AWS)
- Credenciales AWS con permisos para Cognito y S3
- Variables de entorno configuradas (ver abajo)

## Configuración

El archivo `src/main/resources/application.properties` define la conexión a PostgreSQL y lee secretos desde variables de entorno.

Creá un archivo `.env` en la raíz del servicio (está en `.gitignore`):

```env
SPRING_DATASOURCE_PASSWORD=tu_password_de_postgres
AWS_COGNITO_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `SPRING_DATASOURCE_PASSWORD` | Sí | Password de PostgreSQL |
| `AWS_COGNITO_REGION` | Sí | Región del User Pool |
| `AWS_COGNITO_USER_POOL_ID` | Sí | ID del User Pool |
| `AWS_COGNITO_CLIENT_ID` | Sí | Client ID de Cognito |
| `SERVER_PORT` | No | Puerto HTTP (default `8080`) |
| `AWS_S3_REGION` | No | Región del bucket (default `us-east-1`) |
| `AWS_S3_CERTIFICADOS_BUCKET` | No | Bucket de certificados (default `fertilar-certificados`) |

Para operaciones con Cognito y S3, el SDK de AWS usa la cadena de credenciales por defecto. Configurá una de estas opciones:

- Perfil en `~/.aws/credentials` (`aws configure`)
- Variables `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`

Spring Boot no carga `.env` automáticamente. Antes de levantar el servicio, exportá las variables en tu terminal.

**PowerShell (Windows):**

```powershell
cd backend/fertilar-service

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}
```

**Bash (Linux / macOS):**

```bash
cd backend/fertilar-service
set -a && source .env && set +a
```

## Levantar en desarrollo

```bash
cd backend/fertilar-service
mvn spring-boot:run
```

Con las variables cargadas, la API queda en [http://localhost:8080](http://localhost:8080).

Health check:

```text
GET http://localhost:8080/actuator/health
```

## Compilar

```bash
mvn clean package
```

El JAR se genera en `target/fertilar-service-0.0.1-SNAPSHOT.jar`.

Ejecutarlo manualmente:

```bash
java -jar target/fertilar-service-0.0.1-SNAPSHOT.jar
```

## Deploy a Elastic Beanstalk

Desde PowerShell en la raíz del servicio:

```powershell
.\deploy.ps1
```

Genera `target/deploy.zip` con el JAR y el `Procfile`. Subilo al entorno de Elastic Beanstalk.

En producción (EB) el puerto es **5000** según el `Procfile`. Configurá las mismas variables de entorno en la consola de Elastic Beanstalk.

## Notas

- JPA usa `ddl-auto=update`: Hibernate crea/actualiza tablas al arrancar.
- La base apunta por defecto al RDS de AWS; necesitás red accesible hacia ese host.
- CORS está habilitado para todos los orígenes, apto para desarrollo con el frontend en `localhost:5173`.

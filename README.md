# FertilAR

Monorepo del proyecto FertilAR: API REST e interfaz web para monitoreo de pilas de compostaje.

## Estructura

```
monorepo/
├── backend/fertilar-service/   # API Spring Boot (Java 17)
└── frontend/fertilar-ui/       # UI React + Vite + TypeScript
```

## Requisitos

| Componente | Herramientas |
|------------|--------------|
| Backend | JDK 17, Maven 3.9+ |
| Frontend | Node.js 20 LTS, npm |
| Infraestructura | PostgreSQL (RDS), AWS Cognito, AWS S3 |

Necesitás acceso a la base PostgreSQL en AWS, un User Pool de Cognito configurado y credenciales AWS con permisos para Cognito y S3.

## Levantar en desarrollo

### 1. Backend

Creá `backend/fertilar-service/.env` (está en `.gitignore`):

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

Para Cognito y S3, configurá credenciales AWS (`aws configure`, o `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).

Spring Boot no carga `.env` solo. Exportá las variables antes de arrancar.

**PowerShell (Windows):**

```powershell
cd backend/fertilar-service

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}

mvn spring-boot:run
```

**Bash (Linux / macOS):**

```bash
cd backend/fertilar-service
set -a && source .env && set +a
mvn spring-boot:run
```

La API queda en [http://localhost:8080](http://localhost:8080).

Health check: `GET http://localhost:8080/actuator/health`

### 2. Frontend

Creá `frontend/fertilar-ui/.env`:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
VITE_API_URL=http://localhost:8080
VITE_LOGO_URL=https://tu-bucket.s3.us-east-1.amazonaws.com/logo.jpg
```

| Variable | Descripción |
|----------|-------------|
| `VITE_COGNITO_USER_POOL_ID` | ID del User Pool de Cognito |
| `VITE_COGNITO_CLIENT_ID` | Client ID de la app en Cognito |
| `VITE_COGNITO_REGION` | Región de AWS (ej. `us-east-1`) |
| `VITE_API_URL` | URL base del backend, sin barra final |
| `VITE_LOGO_URL` | URL del logo (opcional) |

```bash
cd frontend/fertilar-ui
npm install
npm run dev
```

La app queda en [http://localhost:5173](http://localhost:5173).

## Comandos útiles

**Backend — compilar JAR:**

```bash
cd backend/fertilar-service
mvn clean package
java -jar target/fertilar-service-0.0.1-SNAPSHOT.jar
```

**Frontend — build de producción:**

```bash
cd frontend/fertilar-ui
npm run build      # salida en dist/
npm run preview    # sirve el build localmente
npm run lint       # ESLint
```

## Deploy

**Backend (Elastic Beanstalk):** desde `backend/fertilar-service`:

```powershell
.\deploy.ps1
```

Genera `target/deploy.zip` con el JAR y el `Procfile`. Subilo al entorno de EB. En producción el puerto es **5000**. Configurá las mismas variables de entorno en la consola de Elastic Beanstalk.

**Frontend:** compilá con `npm run build` y subí `dist/` al hosting (S3 + CloudFront, Netlify, etc.) con las variables `VITE_*` definidas en el entorno de build.

## Notas

- JPA usa `ddl-auto=update`: Hibernate crea/actualiza tablas al arrancar.
- La base apunta por defecto al RDS de AWS; necesitás red accesible hacia ese host.
- CORS está habilitado para todos los orígenes (desarrollo con frontend en `localhost:5173`).
- El login se hace contra Cognito; la UI llama al backend con el JWT en `Authorization: Bearer`.
- Las variables `VITE_*` se embeben al compilar; cambiarlas requiere un nuevo build.

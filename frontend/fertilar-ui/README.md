# FertilAR UI

Interfaz web de FertilAR. React 19 + TypeScript + Vite. Autenticación con AWS Cognito y consumo de la API REST del backend.

## Requisitos

- [Node.js](https://nodejs.org/) 20 LTS o superior
- npm (incluido con Node)
- Backend de FertilAR levantado o desplegado (Elastic Beanstalk)
- User Pool de Cognito configurado

## Configuración

Copiá las variables de entorno en un archivo `.env` en la raíz del proyecto:

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

Para desarrollo local contra el backend en tu máquina:

```env
VITE_API_URL=http://localhost:8080
```

Para apuntar al backend desplegado, usá la URL de Elastic Beanstalk.

## Levantar en desarrollo

```bash
cd frontend/fertilar-ui
npm install
npm run dev
```

La app queda disponible en [http://localhost:5173](http://localhost:5173).

## Otros comandos

```bash
npm run build    # compila para producción (salida en dist/)
npm run preview  # sirve el build localmente
npm run lint     # ESLint
```

## Build de producción

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`. Subilos al hosting que uses (S3 + CloudFront, Netlify, etc.) con las mismas variables `VITE_*` definidas en el entorno de build.

## Notas

- Las variables `VITE_*` se embeben en el bundle al compilar; cambiarlas requiere un nuevo build.
- El login se hace directo contra Cognito; luego la UI llama al backend con el JWT en el header `Authorization`.
- Si ves errores de CORS, verificá que el backend tenga CORS habilitado y que `VITE_API_URL` sea correcta.

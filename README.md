# Sistema de Gestión Documental
Aplicación web que permite almacenar, organizar, consultar y compartir archivos digitales `.txt` y `.md` entre usuarios de una organización, controlando el espacio de almacenamiento, permisos de acceso `LECTURA`, `COMENTAR`, `EDICION`, papelera de reciclaje con restauración, auditoría de actividades y generación de reportes mediante *Aggregation Pipelines*. Está construida con el servidor API REST en Node.js y Express, la aplicación cliente en Angular 21 LTS y el almacenamiento documental íntegro en MongoDB.

Mauricio Joel Gómez Barrios - 202031478

## Requisitos:
* **Node.js:** Versión 20.19+ o 22 LTS (incluye `npm`).
* **MongoDB:** Versión 6.0 o superior (servicio local corriendo en el puerto `27017`).
* **Angular CLI:** Versión 21 (`@angular/cli`).
* **Sistema Operativo:** Compatible multiplataforma (Probado en Linux Ubuntu).

## Cómo Ejecutar
Para que el sistema funcione correctamente desde cero, el servicio de MongoDB debe estar activo. El proyecto incluye un script automatizado de carga inicial `seed` que limpia la base de datos `gestor_documentos`, crea las colecciones con sus índices y carga los usuarios, jerarquía de carpetas, 55 archivos `.txt` y `.md` (con su contenido almacenado nativamente en MongoDB), permisos de compartición y registros de actividad.

## Opción 1: Usar el script automático desde cero (Recomendado)
Ubicarse en la raíz del repositorio y ejecutar en la terminal:
```bash
chmod +x iniciar.sh
./iniciar.sh
```

## Opción 2: Ejecución manual paso a paso
1) Inicializar y levantar el Backend (Puerto 3000):
```bash
cd backend
npm install
npm run seed
npm start
```

2) En otra pestaña de terminal, ubicarse en la carpeta frontend:
```bash
cd frontend
npm install
npm start
```

Una vez que la terminal indique que los servicios iniciaron, abre el navegador e ingresa a http://localhost:4200.

## Credenciales de Acceso (Usuarios de Prueba)
Se cuenta con autenticación JWT, protección de rutas (authGuard) y control de acceso basado en roles (ADMIN y USUARIO). Las siguientes credenciales generadas por la carga inicial (o los botones de acceso rápido en la pantalla de Login) son para evaluar cada módulo:

ROL             Usuario         Correo                          Contraseña
Administrador   admin           admin@organizacion.com          1234
Usuario         mauricio        mauricio@organizacion.com       1234
Usuario         aitana          aitana@organizacion.com         1234
Usuario         lamine          lamine@organizacion.com         1234

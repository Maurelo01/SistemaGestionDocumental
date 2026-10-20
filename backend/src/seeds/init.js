require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Usuario = require('../models/usuarios');
const Carpeta = require('../models/carpetas');
const Archivo = require('../models/archivos');
const Permiso = require('../models/permisos');
const Actividad = require('../models/reportes');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestor_documentos';

const diasAtras = (dias) =>
{
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha;
};

const ejecutarCargaInicial = async () =>
{
    try
    {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Conectado a la base de datos. Limpiando base de datos y cargando datos iniciales...');
        await Promise.all
        ([
            Usuario.deleteMany({}),
            Carpeta.deleteMany({}),
            Archivo.deleteMany({}),
            Permiso.deleteMany({}),
            Actividad.deleteMany({}),
        ]);
        const contrasenaHash = await bcrypt.hash('1234', 10);
        const usuariosCreados = await Usuario.insertMany
        ([
            {
                nombreUsuario: 'admin',
                correo: 'admin@organizacion.com',
                contrasenaHash,
                rol: 'ADMIN',
                activo: true,
            },
            {
                nombreUsuario: 'mauricio',
                correo: 'mauricio@organizacion.com',
                contrasenaHash,
                rol: 'USUARIO',
                activo: true,
            },
            {
                nombreUsuario: 'aitana',
                correo: 'aitana@organizacion.com',
                contrasenaHash,
                rol: 'USUARIO',
                activo: true,
            },
            {
                nombreUsuario: 'lamine',
                correo: 'lamine@organizacion.com',
                contrasenaHash,
                rol: 'USUARIO',
                activo: true,
            },
        ]);

        const [admin, mauricio, aitana, lamine] = usuariosCreados;
        console.log(`${usuariosCreados.length} usuarios creados (Contraseña: 1234).`);

        // Carpetas de Mauricio
        const carpProyectos = await Carpeta.create
        ({
            nombre: 'Proyectos_Ingenieria',
            propietarioId: mauricio._id,
            carpetaPadreId: null,
            ancestros: [],
        });
        const carpBackend = await Carpeta.create
        ({
            nombre: 'Backend_Node',
            propietarioId: mauricio._id,
            carpetaPadreId: carpProyectos._id,
            ancestros: [carpProyectos._id],
        });
        const carpDocumentacion = await Carpeta.create
        ({
            nombre: 'Documentacion_Tecnica',
            propietarioId: mauricio._id,
            carpetaPadreId: carpBackend._id,
            ancestros: [carpProyectos._id, carpBackend._id],
        });
        const carpContratosMau = await Carpeta.create
        ({
            nombre: 'Contratos_Clientes',
            propietarioId: mauricio._id,
            carpetaPadreId: null,
            ancestros: [],
        });
        const carpPapeleraMau = await Carpeta.create
        ({
            nombre: 'Borradores_Antiguos',
            propietarioId: mauricio._id,
            carpetaPadreId: null,
            ancestros: [],
            papelera:
            {
                eliminado: true,
                fechaEliminacion: diasAtras(2),
                eliminadoPor: mauricio._id,
            },
        });

        // Carpetas de Aitana
        const carpAdministracion = await Carpeta.create
        ({
            nombre: 'Gestion_Administrativa',
            propietarioId: aitana._id,
            carpetaPadreId: null,
            ancestros: [],
        });
        const carpInformesAitana = await Carpeta.create
        ({
            nombre: 'Informes_Mensuales',
            propietarioId: aitana._id,
            carpetaPadreId: carpAdministracion._id,
            ancestros: [carpAdministracion._id],
        });
        const carpAuditoriaAitana = await Carpeta.create
        ({
            nombre: 'Auditorias_2026',
            propietarioId: aitana._id,
            carpetaPadreId: carpInformesAitana._id,
            ancestros: [carpAdministracion._id, carpInformesAitana._id],
        });

        // Carpetas de Lamine
        const carpFinanzas = await Carpeta.create
        ({
            nombre: 'Finanzas_Y_Presupuestos',
            propietarioId: lamine._id,
            carpetaPadreId: null,
            ancestros: [],
        });
        const carpFacturas = await Carpeta.create
        ({
            nombre: 'Facturacion_Q3',
            propietarioId: lamine._id,
            carpetaPadreId: carpFinanzas._id,
            ancestros: [carpFinanzas._id],
        });

        // Carpeta de Admin
        const carpNormativas = await Carpeta.create
        ({
            nombre: 'Normativas_Internas',
            propietarioId: admin._id,
            carpetaPadreId: null,
            ancestros: [],
        });

        const todasLasCarpetas =
        [
            carpProyectos,
            carpBackend,
            carpDocumentacion,
            carpContratosMau,
            carpPapeleraMau,
            carpAdministracion,
            carpInformesAitana,
            carpAuditoriaAitana,
            carpFinanzas,
            carpFacturas,
            carpNormativas,
        ];
        console.log(`[Seed] ${todasLasCarpetas.length} carpetas y subcarpetas creadas.`);

        const plantillasArchivos =
        [
            // Mauricio - 22 archivos
            { propietario: mauricio, carpeta: carpProyectos, ext: '.md', base: 'arquitectura_sistema' },
            { propietario: mauricio, carpeta: carpBackend, ext: '.md', base: 'endpoints_api_rest' },
            { propietario: mauricio, carpeta: carpDocumentacion, ext: '.txt', base: 'notas_reunion' },
            { propietario: mauricio, carpeta: carpContratosMau, ext: '.txt', base: 'contrato_servicios' },
            { propietario: mauricio, carpeta: null, ext: '.md', base: 'pendientes_semanales' },
            // Aitana - 16 archivos
            { propietario: aitana, carpeta: carpAdministracion, ext: '.txt', base: 'acta_administrativa' },
            { propietario: aitana, carpeta: carpInformesAitana, ext: '.md', base: 'informe_ejecutivo' },
            { propietario: aitana, carpeta: carpAuditoriaAitana, ext: '.md', base: 'revision_procesos' },
            { propietario: aitana, carpeta: null, ext: '.txt', base: 'directorio_proveedores' },
            // Lamine - 12 archivos
            { propietario: lamine, carpeta: carpFinanzas, ext: '.md', base: 'balance_trimestral' },
            { propietario: lamine, carpeta: carpFacturas, ext: '.txt', base: 'control_pagos' },
            { propietario: lamine, carpeta: null, ext: '.txt', base: 'resumen_caja_chica' },
            // Admin - 5 archivos
            { propietario: admin, carpeta: carpNormativas, ext: '.md', base: 'politica_seguridad' },
        ];

        const archivosParaInsertar = [];
        let contadorGlobal = 1;

        for (let i = 0; i < 55; i++) 
        {
            const plantilla = plantillasArchivos[i % plantillasArchivos.length];
            const nombreArchivo = `${plantilla.base}_${contadorGlobal}`;
            const esMarkdown = plantilla.ext === '.md';

            const contenidoTexto = esMarkdown
                ? `# Documento: ${nombreArchivo}\n\n## Resumen\nDocumento generado para la organización.\n- Autor: **${plantilla.propietario.nombreUsuario}**\n- Registro N°: ${contadorGlobal}\n\n### Detalles\nContenido almacenado directamente en MongoDB cumpliendo las reglas del sistema.`
                : `REGISTRO OFICIAL: ${nombreArchivo.toUpperCase()}\nAutor: ${plantilla.propietario.nombreUsuario}\nFecha de generación: 2026\nDetalle: Documento administrativo de texto plano almacenado de forma íntegra en la colección de archivos.`;

            const tamanoBytes = Buffer.byteLength(contenidoTexto, 'utf8');
            const enPapelera = i >= 49; // Los últimos 6 archivos estarán en la papelera
            const fechaCreacionArchivo = diasAtras(30 - (i % 25));

            const comentariosArchivo = [];
            if (i % 3 === 0)
            {
                comentariosArchivo.push
                ({
                    usuarioId: aitana._id,
                    nombreUsuario: aitana.nombreUsuario,
                    texto: 'Documento revisado, los datos son correctos.',
                    fechaCreacion: diasAtras(5),
                });
            }
            if (i % 5 === 0)
            {
                comentariosArchivo.push
                ({
                    usuarioId: lamine._id,
                    nombreUsuario: lamine.nombreUsuario,
                    texto: 'Favor actualizar el apartado de costos antes del viernes.',
                    fechaCreacion: diasAtras(2),
                });
            }
            archivosParaInsertar.push
            ({
                nombre: nombreArchivo,
                extension: plantilla.ext,
                contenido: contenidoTexto,
                tamanoBytes,
                propietarioId: plantilla.propietario._id,
                carpetaId: enPapelera ? carpPapeleraMau._id : (plantilla.carpeta ? plantilla.carpeta._id : null),
                comentarios: comentariosArchivo,
                papelera: {
                eliminado: enPapelera,
                fechaEliminacion: enPapelera ? diasAtras(1) : null,
                eliminadoPor: enPapelera ? plantilla.propietario._id : null,
                },
                fechaCreacion: fechaCreacionArchivo,
                fechaActualizacion: fechaCreacionArchivo,
            });
            contadorGlobal++;
        }

        const archivosCreados = await Archivo.insertMany(archivosParaInsertar);
        console.log(`[Seed] ${archivosCreados.length} archivos (.txt y .md) creados (incluye 6 en papelera).`);

        // Actualizar el subdocumento de almacenamiento en cada Usuario (Consistencia de espacio)
        for (const usuario of usuariosCreados) {
        const archivosDelUsuario = archivosCreados.filter(
            (a) => a.propietarioId.toString() === usuario._id.toString()
        );
        const totalBytes = archivosDelUsuario.reduce((acc, a) => acc + a.tamanoBytes, 0);

        await Usuario.updateOne(
            { _id: usuario._id },
            {
            $set: {
                'almacenamiento.bytesUsados': totalBytes,
                'almacenamiento.cantidadArchivos': archivosDelUsuario.length,
            },
            }
        );
        }
        console.log('[Seed] Métricas de almacenamiento por usuario actualizadas.');

        // Crear 24 Operaciones de Compartición (Permisos)
        const niveles = ['LECTURA', 'EDICION', 'COMENTAR'];
        const permisosParaInsertar = [];

        // Compartir los primeros 18 archivos activos con otros usuarios
        for (let i = 0; i < 18; i++)
        {
            const archivo = archivosCreados[i];
            const posiblesReceptores = usuariosCreados.filter
            (
                (u) => u._id.toString() !== archivo.propietarioId.toString()
            );
            const receptor = posiblesReceptores[i % posiblesReceptores.length];
            permisosParaInsertar.push
            ({
                recursoId: archivo._id,
                tipoRecurso: 'ARCHIVO',
                propietarioId: archivo.propietarioId,
                compartidoConId: receptor._id,
                nivelAcceso: niveles[i % niveles.length],
                fechaCreacion: diasAtras(15 - (i % 10)),
            });

        // a los primeros 4 archivos se agrega un segundo usuario compartido (para el reporte de archivos más compartidos)
        if (i < 4)
        {
            const segundoReceptor = posiblesReceptores[(i + 1) % posiblesReceptores.length];
            permisosParaInsertar.push
            ({
                recursoId: archivo._id,
                tipoRecurso: 'ARCHIVO',
                propietarioId: archivo.propietarioId,
                compartidoConId: segundoReceptor._id,
                nivelAcceso: 'LECTURA',
                fechaCreacion: diasAtras(10),
            });
        }
        }

        // Compartir también 2 carpetas
        permisosParaInsertar.push(
        {
            recursoId: carpProyectos._id,
            tipoRecurso: 'CARPETA',
            propietarioId: mauricio._id,
            compartidoConId: aitana._id,
            nivelAcceso: 'EDICION',
            fechaCreacion: diasAtras(12),
        },
        {
            recursoId: carpAdministracion._id,
            tipoRecurso: 'CARPETA',
            propietarioId: aitana._id,
            compartidoConId: lamine._id,
            nivelAcceso: 'LECTURA',
            fechaCreacion: diasAtras(8),
        }
        );

        const permisosCreados = await Permiso.insertMany(permisosParaInsertar);
        console.log(`[Seed] ${permisosCreados.length} permisos de compartición creados.`);

        // Generar Historial de Actividad completo (Auditoría y Reportes)
        const actividadesParaInsertar = [];

        // Registrar creación de carpetas
        for (const carpeta of todasLasCarpetas)
        {
            actividadesParaInsertar.push
            ({
                usuarioId: carpeta.propietarioId,
                accion: 'CREAR',
                recursoId: carpeta._id,
                tipoRecurso: 'CARPETA',
                datosRecurso: { nombre: carpeta.nombre, extension: null },
                detalles: `Carpeta '${carpeta.nombre}' creada`,
                fechaCreacion: diasAtras(28),
            });
        }

        // Registrar creación y operaciones variadas sobre los archivos
        const accionesExtra = ['LEER', 'EDITAR', 'DESCARGAR', 'RENOMBRAR', 'MOVER', 'COMENTAR'];

        for (let i = 0; i < archivosCreados.length; i++)
        {
        const archivo = archivosCreados[i];
        // Evento de creación
        actividadesParaInsertar.push
        ({
            usuarioId: archivo.propietarioId,
            accion: 'CREAR',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            datosRecurso: { nombre: archivo.nombre, extension: archivo.extension },
            detalles: `Archivo '${archivo.nombre}${archivo.extension}' almacenado (${archivo.tamanoBytes} bytes)`,
            fechaCreacion: archivo.fechaCreacion,
        });
        // Agregar múltiples operaciones a los primeros 15 archivos (para el reporte de "Archivos con más operaciones")
        if (i < 15)
        {
            const cantidadOps = (i % 4) + 2;
            for (let j = 0; j < cantidadOps; j++)
            {
                const accionElegida = accionesExtra[(i + j) % accionesExtra.length];
                actividadesParaInsertar.push
                ({
                    usuarioId: archivo.propietarioId,
                    accion: accionElegida,
                    recursoId: archivo._id,
                    tipoRecurso: 'ARCHIVO',
                    datosRecurso: { nombre: archivo.nombre, extension: archivo.extension },
                    detalles: `Operación ${accionElegida} ejecutada sobre el archivo`,
                    fechaCreacion: diasAtras(14 - (j * 2)),
                });
            }
        }

        // Si el archivo está en papelera, registrar la acción PAPELERA
        if (archivo.papelera.eliminado)
        {
            actividadesParaInsertar.push
            ({
                usuarioId: archivo.propietarioId,
                accion: 'PAPELERA',
                recursoId: archivo._id,
                tipoRecurso: 'ARCHIVO',
                datosRecurso: { nombre: archivo.nombre, extension: archivo.extension },
                detalles: 'Archivo enviado a la papelera de reciclaje',
                fechaCreacion: diasAtras(1),
            });
        }
        }

        // Registrar en el historial las comparticiones realizadas
        for (const permiso of permisosCreados.slice(0, 15))
        {
            const archivoRel = archivosCreados.find
            (
                (a) => a._id.toString() === permiso.recursoId.toString()
            );
            if (archivoRel)
            {
                actividadesParaInsertar.push
                ({
                    usuarioId: permiso.propietarioId,
                    accion: 'COMPARTIR',
                    recursoId: archivoRel._id,
                    tipoRecurso: 'ARCHIVO',
                    datosRecurso: { nombre: archivoRel.nombre, extension: archivoRel.extension },
                    detalles: `Compartido con nivel de acceso: ${permiso.nivelAcceso}`,
                    fechaCreacion: permiso.fechaCreacion,
                });
            }
        }

        // Registrar 2 eliminaciones definitivas
        actividadesParaInsertar.push(
            {
                usuarioId: mauricio._id,
                accion: 'ELIMINAR_DEFINITIVO',
                recursoId: new mongoose.Types.ObjectId(),
                tipoRecurso: 'ARCHIVO',
                datosRecurso: { nombre: 'borrador_temporal_obsoleto', extension: '.txt' },
                detalles: 'Eliminación permanente desde la papelera',
                fechaCreacion: diasAtras(3),
            },
            {
                usuarioId: aitana._id,
                accion: 'RESTAURAR',
                recursoId: archivosCreados[0]._id,
                tipoRecurso: 'ARCHIVO',
                datosRecurso: { nombre: archivosCreados[0].nombre, extension: archivosCreados[0].extension },
                detalles: 'Archivo restaurado desde la papelera',
                fechaCreacion: diasAtras(4),
            }
        );

        const actividadesCreadas = await Actividad.insertMany(actividadesParaInsertar);
        console.log(`[Seed] ${actividadesCreadas.length} registros de actividad guardados en el historial.`);

        console.log(' CARGA INICIAL COMPLETADA EXITOSAMENTE');
        console.log(' Credenciales de acceso (Contraseña para todos: 1234):');
        console.log(' - Administrador : admin');
        console.log(' - Usuarios      : mauricio, aitana, lamine');
        process.exit(0);
    }
    catch (error)
    {
        console.error('[Seed] Error durante la carga inicial:', error);
        process.exit(1);
    }
};

ejecutarCargaInicial();
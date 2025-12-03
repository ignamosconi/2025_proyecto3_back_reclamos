import { Injectable, Inject } from '@nestjs/common';
import type { IComentarioRepository } from '../comentario/repositories/interfaces/comentario.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { ICOMENTARIO_REPOSITORY } from '../comentario/repositories/interfaces/comentario.repository.interface';

@Injectable()
export class ComentarioSeeder {
  constructor(
    @Inject(ICOMENTARIO_REPOSITORY)
    private readonly comentarioRepo: IComentarioRepository,
    @Inject('IReclamoRepository')
    private readonly reclamoRepo: IReclamoRepository,
    @Inject('IUsersRepository')
    private readonly userRepo: IUsersRepository,
  ) {}

  async run() {
    const existing = await this.comentarioRepo.countByReclamoId('000000000000000000000000');
    if (existing > 0) {
      // Verificar si hay comentarios en algún reclamo
      const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 1, page: 1 });
      if (reclamosResponse.total > 0) {
        const reclamo = reclamosResponse.data[0];
        const count = await this.comentarioRepo.countByReclamoId(String(reclamo._id));
        if (count > 0) {
          console.log('Comentarios ya existen. Saltando seed.');
          return;
        }
      }
    }

    console.log('Sembrando Comentarios...');

    // Obtener datos necesarios
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 200, page: 1 });
    const reclamos = reclamosResponse.data;

    const usersResponse = await this.userRepo.findAll({} as any);
    const users = usersResponse.data;

    if (reclamos.length === 0 || users.length === 0) {
      console.log('Faltan datos previos (Reclamos o Usuarios). Saltando seed de Comentarios.');
      return;
    }

    // Obtener encargados y gerentes
    const encargados = users.filter((u: any) => u.role === 'Encargado' || u.role === 'Gerente');
    if (encargados.length === 0) {
      console.log('No hay encargados o gerentes. Saltando seed de Comentarios.');
      return;
    }

    // Templates de comentarios variados
    const comentariosTemplates = [
      'Necesitamos revisar este caso con el equipo de desarrollo. El problema parece estar relacionado con la autenticación.',
      'He revisado el código y encontré el problema. Está en la validación de tokens.',
      'El reporte está vacío porque la consulta no está filtrando correctamente. Necesitamos ajustar los parámetros.',
      'He analizado el error y parece ser un problema de configuración en el servidor. Voy a verificar los logs.',
      'El problema está relacionado con la base de datos. Las consultas están tardando demasiado tiempo.',
      'Necesito más información del cliente para poder diagnosticar correctamente el problema.',
      'Ya identifiqué la causa raíz. Es un problema de sincronización entre servicios.',
      'El error se debe a una versión desactualizada del componente. Necesitamos actualizar.',
      'He realizado las pruebas correspondientes y el problema persiste. Necesito revisar con más detalle.',
      'Este es un problema conocido que ya estamos trabajando en resolver en la próxima versión.',
      'Voy a escalar este caso al equipo de arquitectura ya que requiere cambios estructurales.',
      'El problema parece estar relacionado con permisos. Voy a verificar la configuración de acceso.',
      'He encontrado una solución temporal mientras trabajamos en la solución definitiva.',
      'Necesito coordinar con el equipo de DevOps para revisar la infraestructura.',
      'El cliente reportó que el problema se resolvió parcialmente. Seguimos investigando.',
      'Este error está relacionado con la integración con el sistema externo. Revisando configuración.',
      'He aplicado un hotfix para resolver el problema inmediatamente.',
      'El problema requiere cambios en múltiples componentes. Estoy coordinando con otros equipos.',
      'Ya tenemos una solución implementada. Esperando confirmación del cliente.',
      'El error es intermitente, lo que complica el diagnóstico. Necesito más logs del cliente.',
      'Voy a crear un ticket de seguimiento para este problema ya que requiere múltiples pasos.',
      'He identificado que el problema afecta a múltiples usuarios. Priorizando la solución.',
      'El error está relacionado con la carga de datos. Voy a optimizar las consultas.',
      'Necesito acceso a más información del cliente para poder avanzar con el diagnóstico.',
      'He realizado cambios en el código. Esperando confirmación de testing.',
      'El problema requiere actualización de la documentación técnica. Trabajando en ello.',
      'Voy a revisar el historial de cambios para entender qué causó el problema.',
      'Este caso necesita coordinación con el área de facturación. Contactando con ellos.',
      'He encontrado que es un problema de configuración. Ajustando parámetros.',
      'El error está relacionado con el cache. Limpiando y reconstruyendo.',
      'Necesito que el cliente pruebe nuevamente después de los cambios realizados.',
      'He identificado un problema de compatibilidad con el navegador del cliente.',
      'Este problema requiere cambios en la base de datos. Coordinando con DBA.',
      'El error es consecuencia de un cambio reciente. Revisando el historial de commits.',
      'Voy a crear un entorno de prueba para replicar y resolver el problema.',
      'He encontrado una solución pero requiere aprobación antes de implementar.',
      'El problema está relacionado con la red. Revisando configuración de firewall.',
      'Necesito más detalles específicos del cliente para poder resolver el problema.',
      'He aplicado la solución y está funcionando correctamente en el entorno de pruebas.',
      'Este caso requiere una reunión con el cliente para entender mejor el contexto.',
      'El problema está relacionado con fechas y zonas horarias. Ajustando configuración.',
      'He identificado que el problema afecta solo a usuarios con roles específicos.',
      'Voy a revisar las métricas del sistema para identificar patrones del error.',
      'El error está relacionado con la validación de datos. Ajustando reglas de negocio.',
      'He encontrado que es un problema de rendimiento. Optimizando consultas.',
      'Este problema necesita ser resuelto de manera urgente. Priorizando en el backlog.',
      'El error está relacionado con la integración de pagos. Revisando con el proveedor.',
      'He identificado una solución alternativa que podemos implementar rápidamente.',
      'El problema requiere cambios en la UI. Coordinando con el equipo de frontend.',
      'Voy a revisar si hay otros casos similares que puedan darnos pistas.',
      'He encontrado que el problema se resolvió en una versión anterior. Verificando.',
      'El error está relacionado con la configuración de email. Revisando servidor SMTP.',
      'Necesito que el cliente capture más información de error para avanzar.',
      'He identificado que es un problema de concurrencia. Implementando locks.',
      'Este caso está relacionado con un problema mayor que estamos resolviendo.',
      'El error está relacionado con la generación de reportes. Revisando templates.',
      'He aplicado una solución temporal y estoy trabajando en la definitiva.',
      'El problema requiere cambios en la arquitectura. Enviando a arquitectura.',
      'Voy a revisar los logs del servidor para identificar la causa exacta.',
      'He encontrado que el problema es conocido y tiene un workaround documentado.',
      'El error está relacionado con la exportación de datos. Revisando formato.',
      'Necesito acceso al entorno de producción para replicar el problema.',
      'He identificado una solución pero requiere aprobación del gerente técnico.',
      'Este problema afecta múltiples módulos. Coordinando solución integral.',
      'El error está relacionado con la carga de archivos. Revisando límites.',
      'He encontrado que el problema se debe a datos corruptos. Limpiando base de datos.',
      'Voy a crear un script de migración para resolver el problema de manera permanente.',
      'El problema requiere actualización de dependencias. Revisando compatibilidad.',
      'He identificado que es un problema de seguridad. Implementando fix inmediato.',
      'Este caso necesita ser monitoreado después de la solución para verificar estabilidad.',
      'El error está relacionado con la sincronización de datos. Revisando proceso.',
      'He encontrado una solución pero requiere testing exhaustivo antes de implementar.',
      'El problema está relacionado con la configuración de permisos. Ajustando roles.',
      'Necesito coordinar con el cliente para hacer pruebas de la solución propuesta.',
      'He identificado que el problema se debe a un bug conocido. Aplicando patch.',
      'Este error requiere cambios en múltiples capas. Trabajando en solución completa.',
      'El problema está relacionado con la validación de formularios. Revisando reglas.',
      'He aplicado cambios y el problema parece estar resuelto. Esperando confirmación.',
      'Voy a revisar el código relacionado para asegurar que no haya otros problemas similares.',
      'El error está relacionado con la integración de API. Revisando autenticación.',
      'He encontrado que el problema es específico del entorno. Ajustando configuración.',
      'Este caso requiere una solución personalizada. Trabajando en desarrollo específico.',
      'El problema está relacionado con el procesamiento de imágenes. Optimizando.',
      'He identificado una solución rápida que implementaré mientras trabajo en la definitiva.',
      'Voy a revisar la documentación técnica para entender mejor el comportamiento esperado.',
      'El error está relacionado con la búsqueda de datos. Optimizando índices.',
      'He encontrado que el problema se debe a límites de recursos. Ajustando configuración.',
      'Este problema requiere una reunión técnica para definir la mejor solución.',
      'El error está relacionado con la importación de datos. Revisando formato y validación.',
      'He identificado que es un problema de diseño. Necesitamos mejorar la UX.',
      'Voy a crear documentación adicional para evitar este problema en el futuro.',
      'El problema está relacionado con la configuración de notificaciones. Revisando.',
      'He encontrado una solución pero requiere cambios en el flujo de trabajo.',
      'Este error necesita ser documentado como caso de uso especial.',
      'El problema está relacionado con la autenticación de usuarios. Revisando tokens.',
      'He identificado que el problema se debe a una condición de carrera. Implementando fix.',
      'Voy a revisar las métricas de rendimiento para identificar el cuello de botella.',
      'El error está relacionado con la generación de facturas. Revisando templates.',
      'He encontrado que el problema requiere cambios en la lógica de negocio.',
      'Este caso necesita ser priorizado ya que afecta a múltiples clientes.',
      'El problema está relacionado con la sincronización de inventario. Revisando proceso.',
      'He identificado una solución pero requiere aprobación del cliente antes de implementar.',
    ];

    let created = 0;
    let skipped = 0;
    const totalComentarios = 150;

    // Distribuir comentarios entre diferentes reclamos
    for (let i = 0; i < totalComentarios; i++) {
      const reclamo = reclamos[i % reclamos.length];
      const autor = encargados[Math.floor(Math.random() * encargados.length)];
      const texto = comentariosTemplates[i % comentariosTemplates.length];

      try {
        await this.comentarioRepo.create(
          texto,
          String((autor as any)._id || (autor as any).id),
          String((reclamo as any)._id || reclamo.id),
        );
        created++;
        if (created % 20 === 0) {
          console.log(`Comentarios creados: ${created}/${totalComentarios}`);
        }
      } catch (error) {
        skipped++;
        // No mostrar todos los errores para evitar spam en consola
        if (i % 30 === 0) {
          console.error(`Error al crear algunos comentarios: ${error}`);
        }
      }
    }

    console.log(`Comentarios procesados: ${created} creados, ${skipped} errores.`);
  }
}


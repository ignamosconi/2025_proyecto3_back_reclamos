import { Injectable, Inject } from '@nestjs/common';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IProyectosRepository } from '../proyectos/repositories/proyecto.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import type { ITipoReclamoRepository } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';
import { Prioridad } from '../reclamo/enums/prioridad.enum';
import { Criticidad } from '../reclamo/enums/criticidad.enum';
import { EstadoReclamo } from '../reclamo/enums/estado.enum';
import { UserRole } from '../users/helpers/enum.roles';

@Injectable()
export class ReclamosSeeder {
  constructor(
    @Inject('IReclamoRepository') private readonly reclamoRepo: IReclamoRepository,
    @Inject('IProyectosRepository') private readonly proyectoRepo: IProyectosRepository,
    @Inject('IUsersRepository') private readonly userRepo: IUsersRepository,
    @Inject('ITipoReclamoRepository') private readonly tipoReclamoRepo: ITipoReclamoRepository,
  ) {}

  async run() {
    const existing = await this.reclamoRepo.findAllPaginated({ limit: 1, page: 1 });
    if (existing.total > 50) {
      console.log('Ya existen suficientes reclamos. Saltando seed.');
      return;
    }

    console.log('Sembrando Reclamos...');

    // Obtener datos necesarios
    const proyectosResponse = await this.proyectoRepo.findAll({ limit: 100, page: 1 } as any);
    const proyectos = proyectosResponse.data;

    const usersResponse = await this.userRepo.findAll({ limit: 100, page: 1 } as any);
    const users = usersResponse.data;
    const clientes = users.filter((u: any) => u.role === UserRole.CLIENTE);

    const tiposResponse = await this.tipoReclamoRepo.findAll({ limit: 100, page: 1 } as any);
    const tipos = tiposResponse.data;

    if (proyectos.length === 0 || clientes.length === 0 || tipos.length === 0) {
      console.log('Faltan datos previos (Proyectos, Clientes o Tipos). Saltando seed de Reclamos.');
      return;
    }

    // Templates de reclamos con variaciones
    const titulos = [
      'Fallo en Login',
      'Error en Reporte',
      'Problema de Rendimiento',
      'Error al Guardar Datos',
      'Pantalla en Blanco',
      'Error 500 en Servidor',
      'Datos No Se Actualizan',
      'Problema de Conexión',
      'Error al Exportar PDF',
      'Funcionalidad No Responde',
      'Error en Validación de Formulario',
      'Problema con Filtros',
      'Error al Cargar Imágenes',
      'Datos Incorrectos en Dashboard',
      'Problema con Autenticación',
      'Error en Proceso de Pago',
      'Timeout en Consultas',
      'Problema con Notificaciones',
      'Error al Generar Factura',
      'Datos Perdidos al Guardar',
      'Problema de Sincronización',
      'Error en Búsqueda',
      'Problema con Permisos',
      'Error al Eliminar Registro',
      'Problema con Carga de Archivos',
      'Error en Integración con API Externa',
      'Problema con Sesiones',
      'Error en Cálculos',
      'Datos Duplicados',
      'Problema con Fechas',
      'Error en Validación de Email',
      'Problema con Envío de Correos',
      'Error al Imprimir',
      'Problema con Filtros Avanzados',
      'Error en Gráficos',
      'Problema con Base de Datos',
      'Error al Subir Archivos',
      'Problema con Backup',
      'Error en Proceso Automatizado',
      'Problema con Cache',
    ];

    const descripciones = [
      'No puedo ingresar al sistema con mis credenciales. El sistema muestra error de autenticación.',
      'El reporte se genera vacío sin datos. Debería mostrar información de los últimos 30 días.',
      'La aplicación se vuelve muy lenta cuando hay muchos usuarios conectados simultáneamente.',
      'Los datos ingresados no se guardan correctamente. Al recargar la página desaparecen.',
      'La pantalla principal se muestra en blanco después de hacer login. No carga ningún contenido.',
      'Obtengo error 500 del servidor al intentar acceder a ciertas funcionalidades.',
      'Los datos en la base de datos no se actualizan aunque los modifique desde la interfaz.',
      'Se pierde la conexión constantemente y tengo que volver a iniciar sesión.',
      'El botón de exportar PDF no funciona. No se genera ningún archivo.',
      'Una funcionalidad específica no responde cuando hago clic en los botones correspondientes.',
      'El formulario no valida correctamente los campos requeridos y permite enviar datos vacíos.',
      'Los filtros de búsqueda no funcionan correctamente y muestran resultados incorrectos.',
      'Las imágenes no cargan correctamente. Se muestran como iconos rotos.',
      'El dashboard muestra datos incorrectos o desactualizados comparado con otros módulos.',
      'Tengo problemas para autenticarme. A veces funciona y a veces no.',
      'El proceso de pago falla antes de completarse. No se procesa la transacción.',
      'Las consultas a la base de datos tardan demasiado tiempo y generan timeout.',
      'No recibo las notificaciones que debería recibir según mi configuración.',
      'No puedo generar facturas. El sistema muestra error al procesar la solicitud.',
      'Al guardar información importante, los datos se pierden sin motivo aparente.',
      'Los datos no se sincronizan correctamente entre diferentes dispositivos.',
      'La búsqueda no encuentra resultados que sé que existen en el sistema.',
      'No tengo los permisos necesarios para realizar acciones que debería poder hacer.',
      'No puedo eliminar registros. El sistema muestra error al intentar eliminar.',
      'Los archivos que intento subir no se cargan. El proceso se queda en "procesando".',
      'Hay un error en la integración con una API externa. Los datos no se obtienen correctamente.',
      'Mi sesión se cierra inesperadamente mientras estoy trabajando.',
      'Los cálculos en los reportes están incorrectos. Los totales no coinciden.',
      'Se están creando registros duplicados cuando no debería ser posible.',
      'Las fechas se muestran incorrectamente. Hay problemas con zonas horarias.',
      'El sistema no valida correctamente los formatos de email permitidos.',
      'Los correos electrónicos no se envían aunque el sistema indica que fueron enviados.',
      'No puedo imprimir documentos. El sistema no responde al comando de impresión.',
      'Los filtros avanzados no funcionan correctamente y no aplican todas las condiciones.',
      'Los gráficos no se muestran correctamente o muestran datos incorrectos.',
      'Hay problemas al consultar la base de datos. Las consultas fallan frecuentemente.',
      'Los archivos que subo no se almacenan correctamente o no puedo acceder a ellos después.',
      'El proceso de backup falla regularmente y no puedo restaurar datos cuando lo necesito.',
      'Un proceso automatizado que debería ejecutarse periódicamente no se está ejecutando.',
      'El cache no se actualiza correctamente y veo información antigua en la interfaz.',
    ];

    // Distribución realista de estados:
    // 40% Pendiente, 35% En Revisión, 20% Resuelto, 5% Rechazado
    const estados = [
      EstadoReclamo.PENDIENTE,
      EstadoReclamo.PENDIENTE,
      EstadoReclamo.PENDIENTE,
      EstadoReclamo.PENDIENTE,
      EstadoReclamo.EN_REVISION,
      EstadoReclamo.EN_REVISION,
      EstadoReclamo.EN_REVISION,
      EstadoReclamo.EN_REVISION,
      EstadoReclamo.RESUELTO,
      EstadoReclamo.RESUELTO,
      EstadoReclamo.RECHAZADO,
    ];

    const prioridades = [Prioridad.ALTA, Prioridad.MEDIA, Prioridad.MEDIA, Prioridad.BAJA];
    const criticidades = [Criticidad.SI, Criticidad.NO, Criticidad.NO, Criticidad.NO];

    let created = 0;
    const totalReclamos = 120;

    for (let i = 0; i < totalReclamos; i++) {
      // Seleccionar proyecto primero
      const proyecto = proyectos[Math.floor(Math.random() * proyectos.length)];
      
      // Asegurar que el cliente del reclamo sea el mismo que el cliente del proyecto
      let cliente;
      const proyectoClienteId = String((proyecto.cliente as any)?._id || proyecto.cliente);
      cliente = clientes.find((c: any) => 
        String((c as any)._id || c.id) === proyectoClienteId
      );
      
      // Si no encontramos el cliente del proyecto, usar un cliente aleatorio (fallback)
      if (!cliente) {
        cliente = clientes[Math.floor(Math.random() * clientes.length)];
      }
      
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const prioridad = prioridades[Math.floor(Math.random() * prioridades.length)];
      const criticidad = criticidades[Math.floor(Math.random() * criticidades.length)];

      // Obtener area del proyecto
      let areaId: string;
      if (proyecto.areaResponsable && (proyecto.areaResponsable as any)._id) {
        areaId = String((proyecto.areaResponsable as any)._id);
      } else {
        areaId = String(proyecto.areaResponsable);
      }

      const tituloIndex = i % titulos.length;
      const descripcionIndex = i % descripciones.length;

      const reclamoData = {
        titulo: `${titulos[tituloIndex]}${i >= titulos.length ? ` - Caso ${Math.floor(i / titulos.length) + 1}` : ''}`,
        descripcion: descripciones[descripcionIndex],
        prioridad,
        criticidad,
        estado,
        fkCliente: String((cliente as any)._id || (cliente as any).id),
        fkProyecto: String((proyecto as any)._id || (proyecto as any).id),
        fkTipoReclamo: String((tipo as any)._id || (tipo as any).id),
        fkArea: areaId,
      };

      try {
        const reclamoCreado = await this.reclamoRepo.create(reclamoData as any, reclamoData.fkCliente, reclamoData.fkArea);

        // Actualizar estado si no es PENDIENTE (ya que create lo crea como PENDIENTE por defecto)
        if (estado !== EstadoReclamo.PENDIENTE) {
          const reclamoId = String((reclamoCreado as any)._id || reclamoCreado.id);
          await this.reclamoRepo.updateEstado(reclamoId, estado);
        }

        created++;
        if (created % 20 === 0) {
          console.log(`Reclamos creados: ${created}/${totalReclamos}`);
        }
      } catch (error) {
        console.error(`Error al crear reclamo "${reclamoData.titulo}":`, error);
      }
    }

    console.log(`Reclamos sembrados: ${created} creados.`);
  }
}

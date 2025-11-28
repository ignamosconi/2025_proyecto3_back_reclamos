export enum EstadoReclamo {
  PENDIENTE = 'Pendiente',      // Estado inicial (US 7, US 8)
  EN_REVISION = 'En Revisión',  // Una vez que se autoasigna un encargado (US 11)
  RESUELTO = 'Resuelto',        // Estado final
  RECHAZADO = 'Rechazado',      // Estado final
}
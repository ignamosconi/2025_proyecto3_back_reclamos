export enum AccionesHistorial {
  AUTOASIGNAR = 'autoasignar-reclamo',                //US 11
  AGREGAR_ENCARGADO = 'agregar-encargado-reclamo',    //US 12
  ELIMINAR_ENCARGADO = 'eliminar-encargado-reclamo',  //US 12
  COMENTAR = 'comentar-proyecto',                     //US 15 (deprecated, usar COMENTAR_RECLAMO)
  COMENTAR_RECLAMO = 'comentar-reclamo',              //US 15
  CAMBIO_ESTADO = 'modificar-estado-reclamo',         //US 10
  CAMBIO_AREA = 'modificar-area-reclamo',             //US 8
  CREACION = 'creacion-reclamo',                      //Lo cree porque faltaba este caso
}
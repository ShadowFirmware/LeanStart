// Roles
export type Role = 'administrador' | 'emprendedor' | 'mentor' | 'evaluador';

// Estados de empresa
export type EstadoEmpresa =
  | 'borrador'
  | 'pendiente_mentoria'
  | 'en_mentoria'
  | 'observaciones_pendientes'
  | 'observaciones_atendidas'
  | 'pendiente_evaluacion'
  | 'en_evaluacion'
  | 'evaluado'
  | 'publicado'
  | 'devuelto';

// Estados de hipótesis
export type EstadoHipotesis =
  | 'pendiente_validacion'
  | 'requiere_mas_evidencia'
  | 'validada'
  | 'invalidada';

// Estados de observación
export type EstadoObservacion =
  | 'pendiente'
  | 'en_revision'
  | 'atendida'
  | 'cerrada';

// Giros de empresa
export type GiroEmpresa =
  | 'tecnologia'
  | 'educacion'
  | 'salud'
  | 'sustentabilidad'
  | 'alimentacion'
  | 'comercio'
  | 'servicios';

// Tipos de producto
export type TipoProducto = 'producto' | 'servicio';

// Tipos de experimento
export type TipoExperimento =
  | 'encuesta'
  | 'entrevista'
  | 'landing_page'
  | 'prototipo'
  | 'prueba_de_mercado'
  | 'otro';

// Módulos del sistema (para privilegios)
export type Modulo =
  | 'empresas'
  | 'productos'
  | 'lean_canvas'
  | 'hipotesis'
  | 'mentorias'
  | 'evaluaciones'
  | 'reportes'
  | 'usuarios';

// Acciones posibles por módulo
export type Accion = 'ver' | 'crear' | 'editar' | 'eliminar' | 'aprobar' | 'exportar';

// Privilegio: combinación módulo + acción
export interface Privilegio {
  modulo: Modulo;
  accion: Accion;
}

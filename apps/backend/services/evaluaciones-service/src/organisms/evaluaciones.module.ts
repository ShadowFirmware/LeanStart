import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { CriteriosController } from "./criterios.controller";
import { ViabilidadController } from "./viabilidad.controller";
import { EvaluacionesController } from "./evaluaciones.controller";
import { ReportesGeneradosController } from "./reportes-generados.controller";
import { HealthController } from "./health.controller";
import { CriteriosService } from "../molecules/criterios.service";
import { ViabilidadService } from "../molecules/viabilidad.service";
import { EvaluacionesService } from "../molecules/evaluaciones.service";
import { ReportesGeneradosService } from "../molecules/reportes-generados.service";

@Module({
  controllers: [
    CriteriosController,
    ViabilidadController,
    EvaluacionesController,
    ReportesGeneradosController,
    HealthController,
  ],
  providers: [CriteriosService, ViabilidadService, EvaluacionesService, ReportesGeneradosService, InternalHttpClient],
})
export class EvaluacionesModule {}

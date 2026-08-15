import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { EmpresasController } from "./empresas.controller";
import { PublicController } from "./public.controller";
import { CanvasController } from "./canvas.controller";
import { ProductosController } from "./productos.controller";
import { HipotesisController } from "./hipotesis.controller";
import { ObservacionesController } from "./observaciones.controller";
import { ReportesEmpresaController } from "./reportes-empresa.controller";
import { HealthController } from "./health.controller";
import { AsistenteController } from "./asistente.controller";
import { EmpresasService } from "../molecules/empresas.service";
import { EstadoEmpresaService } from "../molecules/estado-empresa.service";
import { CanvasService } from "../molecules/canvas.service";
import { ProductosService } from "../molecules/productos.service";
import { HipotesisService } from "../molecules/hipotesis.service";
import { ObservacionesService } from "../molecules/observaciones.service";
import { ReportesEmpresaService } from "../molecules/reportes-empresa.service";
import { AsistenteService } from "../molecules/asistente.service";

@Module({
  controllers: [
    EmpresasController,
    PublicController,
    CanvasController,
    ProductosController,
    HipotesisController,
    ObservacionesController,
    ReportesEmpresaController,
    HealthController,
    AsistenteController,
  ],
  providers: [
    EmpresasService,
    EstadoEmpresaService,
    CanvasService,
    ProductosService,
    HipotesisService,
    ObservacionesService,
    ReportesEmpresaService,
    InternalHttpClient,
    AsistenteService,
  ],
})
export class EmpresasModule {}

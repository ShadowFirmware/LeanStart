import { Module } from "@nestjs/common";
import { InternalHttpClient } from "@leanstart/backend-commons";
import { EmpresasController } from "./empresas.controller";
import { PublicController } from "./public.controller";
import { CanvasController } from "./canvas.controller";
import { ProductosController } from "./productos.controller";
import { HipotesisController } from "./hipotesis.controller";
import { ObservacionesController } from "./observaciones.controller";
import { HealthController } from "./health.controller";
import { EmpresasService } from "../molecules/empresas.service";
import { EstadoEmpresaService } from "../molecules/estado-empresa.service";
import { CanvasService } from "../molecules/canvas.service";
import { ProductosService } from "../molecules/productos.service";
import { HipotesisService } from "../molecules/hipotesis.service";
import { ObservacionesService } from "../molecules/observaciones.service";

@Module({
  controllers: [
    EmpresasController,
    PublicController,
    CanvasController,
    ProductosController,
    HipotesisController,
    ObservacionesController,
    HealthController,
  ],
  providers: [
    EmpresasService,
    EstadoEmpresaService,
    CanvasService,
    ProductosService,
    HipotesisService,
    ObservacionesService,
    InternalHttpClient,
  ],
})
export class EmpresasModule {}

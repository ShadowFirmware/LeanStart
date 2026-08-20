import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CurrentUser, RequierePrivilegio, type AuthUser } from "@leanstart/backend-commons";
import { ProductosService } from "../molecules/productos.service";
import { CreateProductoDto, UpdateProductoDto } from "../atoms/producto.dto";

@ApiTags("productos")
@Controller("empresas/:empresaId/productos")
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Post()
  @RequierePrivilegio("productos", "crear")
  @ApiOperation({ summary: "Agregar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  crear(@CurrentUser() user: AuthUser, @Param("empresaId") empresaId: string, @Body() dto: CreateProductoDto) {
    return this.productos.crear(user, empresaId, dto);
  }

  @Patch(":productoId")
  @RequierePrivilegio("productos", "editar")
  @ApiOperation({ summary: "Editar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "productoId" })
  actualizar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("productoId") productoId: string,
    @Body() dto: UpdateProductoDto
  ) {
    return this.productos.actualizar(user, empresaId, productoId, dto);
  }

  @Delete(":productoId")
  @RequierePrivilegio("productos", "eliminar")
  @ApiOperation({ summary: "Eliminar producto o servicio" })
  @ApiParam({ name: "empresaId" })
  @ApiParam({ name: "productoId" })
  eliminar(
    @CurrentUser() user: AuthUser,
    @Param("empresaId") empresaId: string,
    @Param("productoId") productoId: string
  ) {
    return this.productos.eliminar(user, empresaId, productoId);
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EmpresasService } from "./empresas.service";
import type { CreateProductoDto, UpdateProductoDto } from "../atoms/producto.dto";

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresas: EmpresasService
  ) {}

  async crear(user: AuthUser, empresaId: string, dto: CreateProductoDto) {
    await this.empresas.obtener(user, empresaId);
    return this.prisma.producto.create({ data: { ...dto, empresaId } });
  }

  async actualizar(user: AuthUser, empresaId: string, productoId: string, dto: UpdateProductoDto) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, productoId);
    return this.prisma.producto.update({ where: { id: productoId }, data: dto });
  }

  async eliminar(user: AuthUser, empresaId: string, productoId: string) {
    await this.empresas.obtener(user, empresaId);
    await this.assertPertenece(empresaId, productoId);
    await this.prisma.producto.delete({ where: { id: productoId } });

    // El producto ya no existe: si quedaran observaciones apuntando a él, serían
    // huérfanas (no hay ninguna tarjeta donde abrir ese hilo para marcarlas como
    // atendidas), bloqueando para siempre "todos los comentarios resueltos".
    await this.prisma.observacion.updateMany({
      where: { empresaId, tipoElemento: "producto", elementoId: productoId, estado: { not: "cerrada" } },
      data: { estado: "cerrada" },
    });

    return { ok: true };
  }

  private async assertPertenece(empresaId: string, productoId: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto || producto.empresaId !== empresaId) {
      throw new NotFoundException("Producto no encontrado en esta empresa.");
    }
  }
}

import { registerDecorator, type ValidationArguments, type ValidationOptions } from "class-validator";

/**
 * Valida que el valor de esta propiedad sea idéntico al de otra del mismo DTO
 * (p. ej. `confirmPassword` contra `password`). Se resuelve en el mismo paso
 * que el resto de la validación, así el error viaja en el array `message` del
 * 400 estándar de Nest, igual que cualquier otro fallo de validación.
 */
export function Match(propiedad: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "match",
      target: object.constructor,
      propertyName,
      constraints: [propiedad],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [propiedadRelacionada] = args.constraints as [string];
          return value === (args.object as Record<string, unknown>)[propiedadRelacionada];
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe coincidir con ${args.constraints[0]}.`;
        },
      },
    });
  };
}

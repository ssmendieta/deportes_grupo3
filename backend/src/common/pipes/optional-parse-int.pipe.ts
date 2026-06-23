import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class OptionalParseIntPipe implements PipeTransform<string, number | undefined> {
  transform(value: string): number | undefined {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`El valor '${value}' no es un número válido`);
    }
    return parsed;
  }
}

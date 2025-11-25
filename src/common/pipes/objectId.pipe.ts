import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

//Este pipe nos permite validar un ObjectId en el controller, para que no llegue uno inválido al repository
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`El id "${value}" no es un ObjectId válido`);
    }
    return value;
  }
}

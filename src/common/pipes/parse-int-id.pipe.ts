import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseIntIdPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'param' || metadata.data !== 'id') {
      return value;
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
      throw new BadRequestException(
        'ParteIntIdPipe espera uma string numérica',
      );
    }

    if (num <= 0) {
      throw new BadRequestException('ParteIntIdPipe deve ser maior que zero');
    }

    return num;
  }
}

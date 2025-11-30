import { ParseObjectIdPipe } from './objectId.pipe';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('debería estar definido', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform - Partición de Equivalencia', () => {
    it('debería retornar el valor si es un ObjectId válido', () => {
      const validId = new Types.ObjectId().toString();
      expect(pipe.transform(validId)).toBe(validId);
    });

    it('debería lanzar BadRequestException si el id es inválido', () => {
      const invalidId = 'invalid-id';
      expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el id es numérico no válido', () => {
      const invalidId = '12345';
      expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el id es vacío', () => {
      const invalidId = '';
      expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
    });
  });
});

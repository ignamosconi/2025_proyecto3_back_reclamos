import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistorialController } from './historial.controller';
import { HistorialService } from './historial.service';
import { HistorialRepository } from './historial.repository';
import { Historial, HistorialSchema } from './schemas/historial.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '../auth/jwt/jwt.module';

@Module({
     imports: [
          MongooseModule.forFeature([{ name: Historial.name, schema: HistorialSchema }]),
          AuthModule,
          UsersModule,
          JwtModule,
     ],
     controllers: [HistorialController],
     providers: [HistorialService, HistorialRepository],
     exports: [HistorialService], // Exportamos el servicio para que ReclamoModule pueda usarlo
})
export class HistorialModule { }

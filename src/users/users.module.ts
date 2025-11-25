import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService} from './users.service';
import { IUSERS_SERVICE } from './interfaces/users.service.interface';
import { UsersRepository } from './users.repository';
import { IUSERS_REPOSITORY } from './interfaces/users.repository.interface';
import { User, UserSchema } from './schemas/user.schema';
import { Area, AreaSchema } from 'src/areasResponsables/schemas/area.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Area.name, schema: AreaSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    { provide: IUSERS_SERVICE, useClass: UsersService },
    { provide: IUSERS_REPOSITORY, useClass: UsersRepository },
  ],
  exports: [IUSERS_SERVICE, MongooseModule],
})
export class UsersModule {}


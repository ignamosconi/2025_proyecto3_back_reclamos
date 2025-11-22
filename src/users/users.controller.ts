import { Controller, Post, Body, Patch, Get, Param, Inject, Query } from '@nestjs/common';
import { IUsersController } from './interfaces/users.controller.interface';
import { CreateClientDto } from './dto/create-client.dto';
import type { IUsersService } from './interfaces/users.service.interface';
import { IUSERS_SERVICE } from './interfaces/users.service.interface';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/objectId.pipe';

@Controller('users')
export class UsersController implements IUsersController {
  constructor(
    @Inject(IUSERS_SERVICE)
    private readonly service: IUsersService,
  ) {}

  @Post('register-client')
  registerClient(@Body() dto: CreateClientDto) {
    return this.service.registerClient(dto);
  }

  @Post('register-staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.service.createStaff(dto);
  }

  @Patch('profile/:userId')
  updateProfile(@Param('userId', ParseObjectIdPipe) userId: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(userId, dto);
  }

  @Patch('staff/:userId')
  updateStaff(@Param('userId', ParseObjectIdPipe) userId: string, @Body() dto: UpdateStaffDto) {
    return this.service.updateStaff(userId, dto);
  }

  @Get()
  findAll(@Query() query: GetUsersQueryDto) {
    return this.service.findAll(query);
  }

  @Get('deleted')
  findDeleted(@Query() query: GetUsersQueryDto) {
    return this.service.findDeleted(query);
  }

  @Patch(':userId')
  softDelete(@Param('userId', ParseObjectIdPipe) userId: string) {
    return this.service.softDelete(userId);
  }

  @Patch(':userId/restore')
  restore(@Param('userId', ParseObjectIdPipe) userId: string) {
    return this.service.restore(userId);
  }
}

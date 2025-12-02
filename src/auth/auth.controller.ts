//ARCHIVO: auth.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { AuthGuard } from './guards/auth.guard';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RefreshToken } from './decorators/refresh-token.decorator';
import { IAuthController } from './interfaces/auth.controller.interface';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from 'src/users/helpers/enum.roles';
import { UserDocument } from 'src/users/schemas/user.schema';


@ApiTags('Auth') // Agrupa en Swagger
@Controller('auth')
export class AuthController implements IAuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Inicia sesión y obtiene tokens (access + refresh)' })
  @ApiCreatedResponse({
    description: 'Tokens generados correctamente',
    type: TokenPairDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas',
  })
  login(@Body() body: LoginDTO): Promise<TokenPairDTO> {
    console.log(`[AuthController] POST /auth/login - Iniciando sesión para usuario: ${body.email}`,);
    return this.service.login(body);
  }

  /*
    → Este endpoint trabaja sobre el header, no sobre @Body, @Query, @Param, entonces NO necesita DTO.
    → Este endpoint NO va protegido con AuthGuard, porque es público (ver summary)
  */
  @Post('tokens')
    @ApiOperation({
    summary: 'Obtiene nuevos tokens usando el refresh token',
  })
  @ApiOkResponse({
    description: 'Tokens renovados exitosamente',
    type: TokenPairDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  tokens(@RefreshToken() token: string) {
    console.log(`[AuthController] POST /auth/tokens - Renovando tokens con refresh token.`,);
    return this.service.tokens(token);
  }

  /*
    OLVIDÉ MI CONTRASEÑA
  */
  // Endpoint para solicitar recuperación de contraseña
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicita el envío de un correo para recuperar contraseña' })
  @ApiOkResponse({
    description: 'Correo enviado con éxito',
    schema: {
      example: { message: 'Email para restablecer contraseña enviado.' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario no encontrado.',
  })
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    console.log(
      `[AuthController] POST /auth/forgot-password - Solicitando recuperación para: ${body.email}`,
    );
    return this.service.forgotPassword(body.email);
  }

  // Endpoint para resetear contraseña usando token
  @Post('reset-password')
  @ApiOperation({ summary: 'Resetea la contraseña usando el token recibido por email' })
  @ApiOkResponse({
    description: 'Contraseña actualizada correctamente',
    schema: {
      example: { message: 'Contraseña actualizada correctamente.' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado',
  })
  async resetPassword(@Body() body: ResetPasswordDTO) {
    console.log(`[AuthController] POST /auth/reset-password - Reseteando contraseña con token.`);
    return this.service.resetPassword(body.token, body.password);
  }


  /*
    EJEMPLO - SIN DOCUMENTAR
    /users/me es un endpoint de ejemplo creado para entender AuthGuard y el concepto de Requests.
    Las Requests en sí están explicadas en auth.guard, línea 55+
  */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint para pruebas. Devuelve los datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    //No tiene DTO porque es de práctica.
    console.log(`[AuthController] GET /auth/me - Devolviendo datos del usuario autenticado: ${req.user.email}`);
    const userDoc = req.user as UserDocument;
    const userId = userDoc._id ? userDoc._id.toString() : (userDoc as any).id?.toString() || '';
    return {
      id: userId,
      _id: userId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      areas: req.user.areas,
      role: req.user.role,
    };
  }
}

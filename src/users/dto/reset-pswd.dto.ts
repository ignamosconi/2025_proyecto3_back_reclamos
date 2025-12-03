//Si el usuario hace click en "olvidé mi contraseña", usaremos estos datos.
export class ResetPasswordUserDto {
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  password?: string | null;
  twoFactorCode?: string | null;
  twoFactorCodeExpires?: Date | null;
}

import { LoginDTO } from '../dto/login.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';
import { ForgotPasswordDTO } from '../dto/forgot-password.dto';
import { ResetPasswordDTO } from '../dto/reset-password.dto';

export interface IAuthController {
  login(
    body: LoginDTO,
  ): Promise<TokenPairDTO | { requires2fa: boolean; email: string }>;
  tokens(token: string): Promise<Partial<TokenPairDTO>>;
  forgotPassword(body: ForgotPasswordDTO): Promise<{ message: string }>;
  resetPassword(body: ResetPasswordDTO): Promise<{ message: string }>;
  verifyTwoFactor(body: { email: string; code: string }): Promise<TokenPairDTO>;
}

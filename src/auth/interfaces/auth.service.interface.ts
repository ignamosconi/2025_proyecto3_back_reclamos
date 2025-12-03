import { LoginDTO } from '../dto/login.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';

export interface IAuthService {
  login(
    body: LoginDTO,
  ): Promise<TokenPairDTO | { requires2fa: boolean; email: string }>;
  tokens(token: string): Promise<Partial<TokenPairDTO>>;
  verifyTwoFactor(email: string, code: string): Promise<TokenPairDTO>;
}

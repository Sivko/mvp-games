import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminSecret = this.configService.get<string>('ADMIN_SECRET');

    // Если ADMIN_SECRET не установлен, разрешаем доступ (для разработки)
    if (!adminSecret) {
      console.warn('ADMIN_SECRET not set, allowing access (development mode)');
      return true;
    }

    // Проверяем заголовок X-Admin-Secret
    const providedSecret = request.headers['x-admin-secret'];

    if (!providedSecret) {
      throw new UnauthorizedException('Admin authorization required');
    }

    if (providedSecret !== adminSecret) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return true;
  }
}

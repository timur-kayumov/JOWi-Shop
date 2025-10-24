import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../constants';
import { DatabaseService } from '../../database/database.service';

export interface JwtPayload {
  sub: string; // user id
  tenant_id: string;
  role: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('AUTH_USER_INACTIVE');
    }

    // Return user info to be attached to request.user
    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}

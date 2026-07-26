import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  ttl: Number(process.env.JWT_TTL ?? '3600'),
  jwt_refresh_ttl: Number(process.env.JWT_REFRESH_TTL ?? '86400'),
}));

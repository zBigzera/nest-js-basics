import { HashingService } from './hashing.service';
import * as bcrypt from 'bcrypt';
export class BcryptService implements HashingService {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }
}

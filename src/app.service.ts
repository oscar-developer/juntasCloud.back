import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Proyecto Juntas Directivas Cloud!...';
  }
}

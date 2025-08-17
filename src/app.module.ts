import { Module } from '@nestjs/common';
import { AuthModule, UserModule } from './modules';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

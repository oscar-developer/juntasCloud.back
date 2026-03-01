import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthUsersModule } from './auth-users/auth-users.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { TenantInvitationsModule } from './tenant-invitations/tenant-invitations.module';
import { PersonasModule } from './personas/personas.module';
import { TerrenosModule } from './terrenos/terrenos.module';
import { JuntasDirectivasModule } from './juntas-directivas/juntas-directivas.module';
import { FaenasModule } from './faenas/faenas.module';
import { AsambleasModule } from './asambleas/asambleas.module';
import { BienesModule } from './bienes/bienes.module';
import { PersonaTerrenosModule } from './persona-terrenos/persona-terrenos.module';
import { JuntaMiembrosModule } from './junta-miembros/junta-miembros.module';
import { FaenaParticipacionesModule } from './faena-participaciones/faena-participaciones.module';
import { AsistenciaAsambleaModule } from './asistencia-asamblea/asistencia-asamblea.module';
import { CajaMovimientosModule } from './caja-movimientos/caja-movimientos.module';

@Module({  
  imports: [
    PrismaModule,
    AuthUsersModule,
    TenantsModule,
    AuthModule,
    TenantInvitationsModule,
    PersonasModule,
    TerrenosModule,
    JuntasDirectivasModule,
    FaenasModule,
    AsambleasModule,
    BienesModule,
    PersonaTerrenosModule,
    JuntaMiembrosModule,
    FaenaParticipacionesModule,
    AsistenciaAsambleaModule,
    CajaMovimientosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

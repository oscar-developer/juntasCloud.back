import { Module } from '@nestjs/common';
import { AppModulesModule } from './app-modules/app-modules.module';
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
import { CajaCategoriasModule } from './caja-categorias/caja-categorias.module';
import { ConceptosCobroModule } from './conceptos-cobro/conceptos-cobro.module';
import { ObligacionesPersonaModule } from './obligaciones-persona/obligaciones-persona.module';
import { ObligacionPagosModule } from './obligacion-pagos/obligacion-pagos.module';
import { ObligacionMovimientosModule } from './obligacion-movimientos/obligacion-movimientos.module';
import { CreditosPersonaModule } from './creditos-persona/creditos-persona.module';
import { CreditoMovimientosModule } from './credito-movimientos/credito-movimientos.module';
import { ReportesCajaModule } from './reportes/Caja/reportes-caja.module';
import { DashboardModule } from './reportes/dashboard/dashboard.module';
import { DeudasPersonaModule } from './reportes/deudas-persona/deudas-persona.module';
import { TopModule } from './reportes/top/top.module';
import { TenantProfilesModule } from './tenant-profiles/tenant-profiles.module';
import { TenantUsersModule } from './tenant-users/tenant-users.module';

@Module({  
  imports: [
    PrismaModule,
    AppModulesModule,
    AuthUsersModule,
    AuthModule,
    TenantsModule,
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
    CajaCategoriasModule,
    CajaMovimientosModule,
    ConceptosCobroModule,
    ObligacionesPersonaModule,
    ObligacionPagosModule,
    ObligacionMovimientosModule,
    CreditosPersonaModule,
    CreditoMovimientosModule,
    ReportesCajaModule,
    DashboardModule,
    DeudasPersonaModule,
    TopModule,
    TenantProfilesModule,
    TenantUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

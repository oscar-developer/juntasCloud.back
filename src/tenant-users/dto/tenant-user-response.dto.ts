import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantUserResponseDto {
  @ApiProperty()
  idTenant: number;

  @ApiProperty()
  idUser: number;

  @ApiProperty()
  role: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  endedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  invitedBy: number | null;

  @ApiPropertyOptional({ nullable: true })
  idPersona: number | null;

  @ApiPropertyOptional({ nullable: true })
  idProfile: number | null;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;
}

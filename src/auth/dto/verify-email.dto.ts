import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'K_k5hD-jb6h8D4v9BNM7P7lPl3Y-OKfeB8RmTkztx5A' })
  @IsString()
  @MinLength(1)
  token!: string;
}

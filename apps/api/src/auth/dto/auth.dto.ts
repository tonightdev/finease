import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  name!: string;

  @ApiProperty({ example: 'rahul@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;

  @ApiProperty({ example: 'male', required: false })
  gender?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  dob?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'rahul@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'rahul@example.com' })
  email!: string;

  @ApiProperty({ example: 'newpassword123' })
  newPassword!: string;
}

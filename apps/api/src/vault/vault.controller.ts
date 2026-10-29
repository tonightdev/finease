import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { VaultService } from './vault.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import type {
  SetupVaultDto,
  CreateVaultItemDto,
  UpdateVaultItemDto,
  VaultItem,
  VaultSettings,
} from '@repo/types';

@ApiTags('Vault')
@ApiBearerAuth('bearer')
@Controller('vault')
@UseGuards(AuthGuard)
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get current user vault encryption settings' })
  async getSettings(
    @Req() req: RequestWithUser,
  ): Promise<VaultSettings | null> {
    return this.vaultService.getSettings(req.user.uid);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Initialize or update vault master key parameters' })
  async setupVault(
    @Req() req: RequestWithUser,
    @Body() dto: SetupVaultDto,
  ): Promise<VaultSettings> {
    return this.vaultService.setupVault(req.user.uid, dto);
  }

  @Delete('reset')
  @ApiOperation({
    summary: 'Wipe all vault credentials and reset vault master settings',
  })
  async resetVault(@Req() req: RequestWithUser): Promise<{ success: boolean }> {
    return this.vaultService.resetVault(req.user.uid);
  }

  @Get('items')
  @ApiOperation({ summary: 'List all encrypted vault items for user' })
  async findAll(@Req() req: RequestWithUser): Promise<VaultItem[]> {
    return this.vaultService.findAll(req.user.uid);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get single encrypted vault item' })
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<VaultItem> {
    return this.vaultService.findOne(req.user.uid, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create new encrypted vault item' })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateVaultItemDto,
  ): Promise<VaultItem> {
    return this.vaultService.create(req.user.uid, dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update existing encrypted vault item' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateVaultItemDto,
  ): Promise<VaultItem> {
    return this.vaultService.update(req.user.uid, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete encrypted vault item' })
  async delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.vaultService.delete(req.user.uid, id);
  }
}

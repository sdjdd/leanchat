import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodSchema } from 'zod';

import { ConfigService } from 'src/config';
import { AuthGuard } from '../guards/auth.guard';
import {
  GreetingMessageConfigSchema,
  NoReadyOperatorMessageConfigSchema,
  AutoCloseConfigSchema,
  QueueConfigSchema,
  EvaluationConfigSchema,
} from '../dtos/config';

const schemas: Record<string, ZodSchema> = {
  greetingMessage: GreetingMessageConfigSchema,
  noReadyOperatorMessage: NoReadyOperatorMessageConfigSchema,
  autoClose: AutoCloseConfigSchema,
  queue: QueueConfigSchema,
  evaluation: EvaluationConfigSchema,
};

@Controller('config')
@UseGuards(AuthGuard)
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Put(':key')
  async setGreetingConfig(@Param('key') key: string, @Body() data: any) {
    const schema = schemas[key];
    if (!schema) {
      throw new BadRequestException('Invalid config key');
    }
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      throw new BadRequestException('Invalid config value');
    }
    await this.configService.setConfig(key, parseResult.data);
  }

  @Get(':key')
  async getGreetingConfig(@Param('key') key: string, @Res() res: Response) {
    const value = await this.configService.getConfig(key, false);
    res.json(value || null);
  }
}

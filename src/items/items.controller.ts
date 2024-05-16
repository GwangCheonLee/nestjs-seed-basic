import { Controller, Get, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { GetUser } from '../common/decorators/get-user';
import { User } from '../users/entities/user.entity';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('api/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @UseGuards(JwtAccessGuard)
  getItems(@GetUser() user: User) {
    console.log(user);
    return 'This action returns all items';
  }
}

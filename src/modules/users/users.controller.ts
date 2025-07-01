import { Body, Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ){}

    @Get()
    getUserById(@Body('userId') id: string ) {
        const user = this.usersService.findUserById(id);
        return user;
    }
    @Get('me')
    getCurrentUser(@CurrentUser('id') id: string) {
        const user = this.usersService.findUserById(id);
        return user;
    }
    
}

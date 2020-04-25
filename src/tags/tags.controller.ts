import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { TagDto } from './models/tag.dto';
import { TagsService } from './tags.service';
import { DeleteResult } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard())
@Controller('tags')
export class TagsController {
  constructor(private readonly tagService: TagsService) {}

  @Get()
  async getTags(@GetUser() user: User): Promise<ReadonlyArray<TagDto>> {
    return await this.tagService.getTags(user);
  }

  @Post()
  async addTag(@GetUser() user: User, @Body() tagDto: TagDto): Promise<TagDto> {
    return await this.tagService.addTag(user, tagDto);
  }

  @Put(':id')
  async updateTag(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() tagDto: TagDto,
  ): Promise<TagDto> {
    return await this.tagService.updateTag(user, id, tagDto);
  }

  @Delete(':id')
  async deleteTag(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return await this.tagService.deleteTag(user, id);
  }
}

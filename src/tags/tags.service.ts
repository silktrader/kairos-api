import { Injectable } from '@nestjs/common';
import { Tag } from './models/tag.entity';
import { Repository, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TagDto } from './models/tag.dto';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async getTags(user: User): Promise<ReadonlyArray<TagDto>> {
    return await this.tagRepository.find({ user });
  }

  async addTag(user: User, tagDto: TagDto): Promise<TagDto> {
    // check for duplicates
    await this.tagRepository.findOneOrFail({
      user,
      name: tagDto.name,
    });

    const tag = new Tag();
    tag.name = tagDto.name;
    tag.description = tagDto.description;
    tag.user = user;
    await this.tagRepository.save(tag);

    // tk use class transformer to avoid this
    delete tag.user;
    return tag;
  }

  async deleteTag(user: User, id: number): Promise<DeleteResult> {
    const existingTag = await this.getTag(user, id);
    return await this.tagRepository.delete(existingTag);
  }

  async getTag(user: User, id: number): Promise<Tag> {
    return await this.tagRepository.findOneOrFail({ user, id });
  }

  async updateTag(user: User, id: number, tagDto: TagDto): Promise<TagDto> {
    const tag = await this.getTag(user, id);
    tag.name = tagDto.name;
    tag.description = tagDto.description;
    return await this.tagRepository.save(tag);
  }
}

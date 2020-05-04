import { Injectable, ConflictException } from '@nestjs/common';
import { Tag } from './models/tag.entity';
import { Repository, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TagDto } from './models/tag.dto';
import { User } from 'src/auth/user.entity';
import randomColor from 'randomcolor';
import { TaskTag } from './models/task-tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(TaskTag)
    private taskTagRepository: Repository<TaskTag>,
  ) {}

  async getTags(user: User): Promise<ReadonlyArray<TagDto>> {
    return await this.tagRepository.find({ user });
  }

  /** Check whether a certain tag exists then calls the `saveTag` method */
  async addTag(user: User, tagDto: TagDto): Promise<TagDto> {
    // check for duplicates
    const existingTag = await this.tagRepository.findOne({
      user,
      name: tagDto.name,
    });

    if (existingTag) throw new ConflictException();

    const tag = await this.saveTag(user, tagDto);

    // tk use class transformer to avoid this
    delete tag.user;
    return tag;
  }

  async getOrAddTag(user: User, name: string): Promise<Tag> {
    return (
      (await this.searchTagName(user, name)) ??
      (await this.saveTag(user, {
        name,
        colour: randomColor({
          luminosity: 'light',
        }),
      }))
    );
  }

  /** Saves a tag without checking performing any checks */
  private async saveTag(user: User, tagDto: TagDto): Promise<Tag> {
    const tag = new Tag();
    tag.name = tagDto.name;
    tag.description = tagDto.description;
    tag.user = user;
    tag.colour = tagDto.colour;
    return await this.tagRepository.save(tag);
  }

  async deleteTag(user: User, id: number): Promise<DeleteResult> {
    // fails when not finding a tag owned by the selected user
    const tag = await this.getTag(user, id);

    // find all the tag entries related to this tag and delete them
    // this is preferable to setting up cascades which are database dependent
    const tagEntries = await this.taskTagRepository.find({ tag });
    await this.taskTagRepository.remove(tagEntries);

    return await this.tagRepository.delete(tag);
  }

  async getTag(user: User, id: number): Promise<Tag> {
    return await this.tagRepository.findOneOrFail({ user, id });
  }

  async searchTagName(user: User, name: string): Promise<Tag | null> {
    return await this.tagRepository.findOne({ user, name });
  }

  async updateTag(user: User, id: number, tagDto: TagDto): Promise<TagDto> {
    const tag = await this.getTag(user, id);
    tag.name = tagDto.name;
    tag.description = tagDto.description;
    tag.colour = tagDto.colour;
    return await this.tagRepository.save(tag);
  }
}

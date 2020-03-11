import { Repository, EntityRepository } from 'typeorm';
import { User } from './user.entity';
import { CredentialsDto } from './credentials.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(credentialsDto: CredentialsDto): Promise<void> {
    // check whether user already exists before computing hash
    const existingUser = await this.findOne({
      email: credentialsDto.email,
    });
    if (existingUser) {
      throw new ConflictException(
        `${credentialsDto.email} is already registered`,
      );
    }

    // generate salts to secure passwords
    const hash = await bcrypt.hash(credentialsDto.password, 10);

    // create and save user
    const user = this.create({
      email: credentialsDto.email,
      hash: hash,
    });

    await this.save(user);
  }

  async validateUser(credentialsDto: CredentialsDto): Promise<boolean> {
    const user = await this.findOne({ email: credentialsDto.email });

    return user && bcrypt.compare(credentialsDto.password, user.hash);
  }
}

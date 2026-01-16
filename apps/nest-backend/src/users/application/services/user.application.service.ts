import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { TelegramUser } from '../../domain/value-objects/telegram-user.vo';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserApplicationService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async findOrCreateUser(createUserDto: CreateUserDto): Promise<string> {
    let user: User | null = null;

    if (createUserDto.telegramId) {
      user = await this.userRepository.findByTelegramId(
        createUserDto.telegramId,
      );
    }

    if (!user && createUserDto.name) {
      user = await this.userRepository.findByName(createUserDto.name);
    }

    if (user) {
      return user.id!;
    }

    const telegramUser = createUserDto.telegramId
      ? TelegramUser.create(
          createUserDto.telegramId,
          createUserDto.telegramUsername,
          createUserDto.telegramFirstName,
          createUserDto.telegramLastName,
          createUserDto.telegramPhotoUrl,
          createUserDto.telegramLanguageCode,
        )
      : undefined;

    const name =
      createUserDto.name || createUserDto.telegramFirstName || 'Неизвестный';
    const newUser = User.create(name, telegramUser);
    const saved = await this.userRepository.save(newUser);
    return saved.id!;
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toResponseDto(user));
  }

  private toResponseDto(user: User): UserResponseDto {
    const telegramData = user.telegramUser?.toObject();
    return {
      _id: user.id || '',
      name: user.name,
      ...telegramData,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

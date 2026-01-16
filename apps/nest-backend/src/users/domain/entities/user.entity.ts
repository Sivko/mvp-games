import { TelegramUser } from '../value-objects/telegram-user.vo';

export class User {
  private constructor(
    private readonly _id: string | null,
    private readonly _name: string,
    private readonly _telegramUser: TelegramUser | null,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  static create(name: string, telegramUser?: TelegramUser): User {
    return new User(null, name, telegramUser || null);
  }

  static reconstitute(
    id: string,
    name: string,
    telegramId?: number,
    telegramUsername?: string,
    telegramFirstName?: string,
    telegramLastName?: string,
    telegramPhotoUrl?: string,
    telegramLanguageCode?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): User {
    const telegramUser = telegramId
      ? TelegramUser.create(
          telegramId,
          telegramUsername,
          telegramFirstName,
          telegramLastName,
          telegramPhotoUrl,
          telegramLanguageCode,
        )
      : null;

    return new User(id, name, telegramUser, createdAt, updatedAt);
  }

  get id(): string | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get telegramUser(): TelegramUser | null {
    return this._telegramUser;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  hasTelegram(): boolean {
    return this._telegramUser !== null;
  }
}

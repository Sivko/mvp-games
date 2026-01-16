export class TelegramUser {
  private constructor(
    private readonly telegramId: number,
    private readonly username?: string,
    private readonly firstName?: string,
    private readonly lastName?: string,
    private readonly photoUrl?: string,
    private readonly languageCode?: string,
  ) {}

  static create(
    telegramId: number,
    username?: string,
    firstName?: string,
    lastName?: string,
    photoUrl?: string,
    languageCode?: string,
  ): TelegramUser {
    return new TelegramUser(
      telegramId,
      username,
      firstName,
      lastName,
      photoUrl,
      languageCode,
    );
  }

  getTelegramId(): number {
    return this.telegramId;
  }

  getUsername(): string | undefined {
    return this.username;
  }

  getFirstName(): string | undefined {
    return this.firstName;
  }

  getLastName(): string | undefined {
    return this.lastName;
  }

  getPhotoUrl(): string | undefined {
    return this.photoUrl;
  }

  getLanguageCode(): string | undefined {
    return this.languageCode;
  }

  toObject(): {
    telegramId: number;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramLastName?: string;
    telegramPhotoUrl?: string;
    telegramLanguageCode?: string;
  } {
    return {
      telegramId: this.telegramId,
      telegramUsername: this.username,
      telegramFirstName: this.firstName,
      telegramLastName: this.lastName,
      telegramPhotoUrl: this.photoUrl,
      telegramLanguageCode: this.languageCode,
    };
  }
}

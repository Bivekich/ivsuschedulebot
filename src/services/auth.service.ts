import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthService {
  private userService: UserService;
  private jwtSecret: string;
  private adminUsername: string;
  private adminPassword: string;

  constructor() {
    this.userService = new UserService();
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    this.adminUsername = process.env.ADMIN_USERNAME || 'admin';
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  }

  // Проверка учетных данных администратора
  async validateAdmin(username: string, password: string): Promise<boolean> {
    return username === this.adminUsername && password === this.adminPassword;
  }

  // Создание JWT токена для администратора
  generateToken(telegramId: string): string {
    return jwt.sign({ telegramId, isAdmin: true }, this.jwtSecret, {
      expiresIn: '24h',
    });
  }

  // Проверка JWT токена
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  // Установка пользователя как администратора
  async setUserAsAdmin(telegramId: string): Promise<boolean> {
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) return false;

    await this.userService.updateByTelegramId(telegramId, { isAdmin: true });
    return true;
  }

  // Проверка, является ли пользователь администратором
  async isAdmin(telegramId: string): Promise<boolean> {
    const user = await this.userService.findByTelegramId(telegramId);
    return !!user && user.isAdmin;
  }
}

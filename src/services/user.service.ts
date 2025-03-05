import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AppDataSource } from '../database/data-source';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['group'] });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId },
      relations: ['group'],
    });
  }

  async findAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { isAdmin: true },
      relations: ['group'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async updateByTelegramId(
    telegramId: string,
    userData: Partial<User>
  ): Promise<User | null> {
    await this.userRepository.update({ telegramId }, userData);
    return this.findByTelegramId(telegramId);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }
}

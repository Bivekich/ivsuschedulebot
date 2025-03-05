import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { AppDataSource } from '../database/data-source';

export class GroupService {
  private groupRepository: Repository<Group>;

  constructor() {
    this.groupRepository = AppDataSource.getRepository(Group);
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find();
  }

  async findById(id: number): Promise<Group | null> {
    return this.groupRepository.findOneBy({ id });
  }

  async findByName(name: string): Promise<Group | null> {
    return this.groupRepository.findOneBy({ name });
  }

  async create(groupData: Partial<Group>): Promise<Group> {
    const group = this.groupRepository.create(groupData);
    return this.groupRepository.save(group);
  }

  async update(id: number, groupData: Partial<Group>): Promise<Group | null> {
    await this.groupRepository.update(id, groupData);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.groupRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }
}

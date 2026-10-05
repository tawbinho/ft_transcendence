import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

// WHY THIS FILE EXISTS
// The users module owns the `users` table. Other modules (auth now, ranking
// and matches later) go through this service instead of touching the table
// directly, so every user query lives in one place.
//
// `Repository<User>` is TypeORM's ready-made toolbox for one table (find,
// save, delete...). `@InjectRepository` asks Nest for it; it is available
// because UsersModule registers the User entity with `forFeature`.
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email });
  }

  findByDisplayName(displayName: string): Promise<User | null> {
    return this.users.findOneBy({ displayName });
  }

  // Builds the row and saves it; the database fills id and timestamps.
  create(data: {
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise<User> {
    return this.users.save(this.users.create(data));
  }
}

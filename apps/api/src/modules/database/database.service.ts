import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@jowi/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  get client() {
    return prisma;
  }

  async onModuleInit() {
    await prisma.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
    console.log('👋 Database disconnected');
  }
}

/**
 * Test script to verify Supabase database connection via Prisma
 * Run with: npx ts-node scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by getting count of users
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    
    // Create a test user if none exist
    if (userCount === 0) {
      console.log('Creating a test user...');
      const testUser = await prisma.user.create({
        data: {
          email: 'test@pizzarat.com',
          username: 'testuser',
          password: 'password123', // In a real app, this would be hashed
          name: 'Test User',
          bio: 'This is a test user created to verify database connectivity.',
        },
      });
      console.log('Test user created:', testUser);
    }
    
    // Create a test pizza place
    console.log('Creating a test pizza place...');
    const testPlace = await prisma.pizzaPlace.create({
      data: {
        name: 'Test Pizza Place',
        address: '123 Pizza Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        description: 'A test pizza place to verify database connectivity.',
        photos: ['https://example.com/pizza.jpg'],
      },
    });
    console.log('Test pizza place created:', testPlace);
    
    // Success!
    console.log('\nDatabase connection and operations successful! ✅');
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

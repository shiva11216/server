import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedAllUsers = async () => {
  try {
    await connectDB();
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@software.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'John Client',
        email: 'client@software.com',
        password: 'client123',
        role: 'client',
      },
      {
        name: 'Sarah Employee',
        email: 'employee@software.com',
        password: 'employee123',
        role: 'employee',
      }
    ];

    console.log('🌱 Seeding users...\n');

    for (const userData of users) {
      const userExists = await User.findOne({ email: userData.email });
      
      if (userExists) {
        console.log(`✅ ${userData.role.toUpperCase()} already exists: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`✨ ${userData.role.toUpperCase()} created: ${userData.email}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 TEST CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👨‍💼 ADMIN:');
    console.log('   Email:    admin@software.com');
    console.log('   Password: admin123\n');
    
    console.log('👔 CLIENT:');
    console.log('   Email:    client@software.com');
    console.log('   Password: client123\n');
    
    console.log('💼 EMPLOYEE:');
    console.log('   Email:    employee@software.com');
    console.log('   Password: employee123\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All users seeded successfully!');
    console.log('🚀 You can now login with any of these credentials\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAllUsers();

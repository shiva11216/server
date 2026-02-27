import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@software.com' });
    
    if (adminExists) {
      // Detect if the stored password looks like a bcrypt hash (starts with $2)
      if (!adminExists.password || !adminExists.password.startsWith('$2')) {
        // force a modification so the pre-save hook will hash it
        adminExists.password = 'admin123';
        adminExists.markModified('password');
        await adminExists.save();
        console.log('🔄 Detected unhashed admin password; reset and hashed it');
      }

      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@software.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@software.com',
      password: 'admin123',
      role: 'admin',
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', admin.role);
    console.log('\n🚀 You can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();

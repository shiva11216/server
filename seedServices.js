import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './models/Service.js';
import connectDB from './config/db.js';

dotenv.config();

const seedServices = async () => {
  try {
    await connectDB();
    
    const services = [
      {
        title: 'Web Development',
        description: 'Full-stack web application development with modern technologies',
        price: 5000,
      },
      {
        title: 'Mobile App Development',
        description: 'Native and cross-platform mobile application development',
        price: 7000,
      },
      {
        title: 'UI/UX Design',
        description: 'User interface and experience design for web and mobile apps',
        price: 3000,
      },
      {
        title: 'Cloud Solutions',
        description: 'Cloud infrastructure setup and management (AWS, Azure, GCP)',
        price: 4000,
      },
      {
        title: 'Database Design',
        description: 'Database architecture and optimization services',
        price: 2500,
      },
      {
        title: 'API Development',
        description: 'RESTful and GraphQL API development and integration',
        price: 3500,
      },
      {
        title: 'DevOps Services',
        description: 'CI/CD pipeline setup and deployment automation',
        price: 4500,
      },
      {
        title: 'Consulting',
        description: 'Technical consulting and architecture planning',
        price: 2000,
      }
    ];

    console.log('🌱 Seeding services...\n');

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services\n');

    // Create new services
    const createdServices = await Service.insertMany(services);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SERVICES CREATED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title}`);
      console.log(`   💰 Price: ₹${service.price}`);
      console.log(`   📝 ${service.description}\n`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${createdServices.length} services seeded successfully!`);
    console.log('🚀 Services are now available in the application\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedServices();

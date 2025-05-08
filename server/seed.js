// Updated seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vee4_order_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@vee4group.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      
      // Option to update password if needed
      // Uncomment these lines to reset the admin password
      /*
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      adminExists.password = hashedPassword;
      await adminExists.save();
      console.log('Admin password updated');
      */
    } else {
      // Create admin user
      // We'll let the User model's pre-save hook handle the password hashing
      // This ensures consistency with the same hashing logic
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@vee4group.com',
        password: 'Admin@123', // Will be hashed by pre-save hook
        company: 'Vee4 Group',
        phone: '1234567890',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
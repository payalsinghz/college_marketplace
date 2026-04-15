const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@college.edu';
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@2025!', salt);

      await User.create({
        name: 'Platform Admin',
        email: adminEmail,
        phone: '0000000000',
        password: hashedPassword,
        role: 'admin'
      });

      console.log('✅ Admin account seeded: admin@college.edu / Admin@2025!');
    } else {
      console.log('ℹ️  Admin account already exists.');
    }
  } catch (error) {
    console.error('❌ Failed to seed admin account:', error);
  }
};

module.exports = seedAdmin;

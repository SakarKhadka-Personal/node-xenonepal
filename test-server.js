require('dotenv').config();
const express = require('express');
const dbConnect = require('./src/config/db');

// Test the server setup
async function testServer() {
  console.log('🚀 Testing XenoNepal Server Setup...\n');
  
  // Test 1: Environment variables
  console.log('1. Environment Variables:');
  console.log(`   PORT: ${process.env.PORT || 5000}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Not set'}\n`);
  
  // Test 2: Dependencies
  console.log('2. Testing Dependencies:');
  try {
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const helmet = require('helmet');
    const compression = require('compression');
    console.log('   ✅ All core dependencies loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Error loading dependencies:', error.message, '\n');
  }
  
  // Test 3: Model imports
  console.log('3. Testing Models:');
  try {
    const User = require('./src/user/user.model');
    const Product = require('./src/product/product.model');
    const Order = require('./src/order/order.model');
    const Setting = require('./src/settings/setting.model');
    console.log('   ✅ All models loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Error loading models:', error.message, '\n');
  }
  
  // Test 4: Controller imports
  console.log('4. Testing Controllers:');
  try {
    const userController = require('./src/user/user.controller');
    const productController = require('./src/product/product.controller');
    const orderController = require('./src/order/order.controller');
    const settingController = require('./src/settings/setting.controller');
    console.log('   ✅ All controllers loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Error loading controllers:', error.message, '\n');
  }
  
  // Test 5: Route imports
  console.log('5. Testing Routes:');
  try {
    const userRoute = require('./src/user/user.route');
    const productRoute = require('./src/product/product.route');
    const orderRoute = require('./src/order/order.route');
    const settingRoute = require('./src/settings/setting.route');
    console.log('   ✅ All routes loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Error loading routes:', error.message, '\n');
  }
  
  // Test 6: Server initialization
  console.log('6. Testing Server Initialization:');
  try {
    const app = express();
    app.get('/test', (req, res) => res.json({ message: 'Server test successful' }));
    console.log('   ✅ Express server initialized successfully\n');
  } catch (error) {
    console.log('   ❌ Error initializing server:', error.message, '\n');
  }
  
  console.log('🎉 Server setup test completed!\n');
  console.log('Next steps:');
  console.log('1. Set up your .env file with MONGO_URI');
  console.log('2. Start the server with: npm start');
  console.log('3. Test API endpoints using Postman or curl');
  console.log('4. Run: node make-admin.js to create an admin user\n');
}

testServer().catch(console.error);

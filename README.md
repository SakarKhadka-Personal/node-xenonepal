# XenoNepal Server - Alien Subs Integration

This server application is now successfully connected with the [node-aliensubs](https://github.com/SakarKhadka-Personal/node-aliensubs.git) repository.

## Project Overview

This is a Node.js Express server that provides API endpoints for managing:
- **Users**: User authentication, profiles, and management
- **Products**: Product catalog and management
- **Orders**: Order processing and tracking
- **Settings**: Application configuration

## Integration Details

The server code has been successfully merged with the alien subs repository, combining:
- Original XenoNepal server functionality
- Enhanced features from the alien subs codebase
- Unified codebase with proper Git history

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── db_simple.js       # Simplified DB connection
│   ├── user/
│   │   ├── user.model.js      # User data model
│   │   ├── user.controller.js # User business logic
│   │   └── user.route.js      # User API routes
│   ├── product/
│   │   ├── product.model.js   # Product data model
│   │   ├── product.controller.js # Product business logic
│   │   └── product.route.js   # Product API routes
│   ├── order/
│   │   ├── order.model.js     # Order data model
│   │   ├── order.controller.js # Order business logic
│   │   └── order.route.js     # Order API routes
│   ├── settings/
│   │   ├── setting.model.js   # Settings data model
│   │   ├── setting.controller.js # Settings business logic
│   │   └── setting.route.js   # Settings API routes
│   └── utils/                 # Utility functions
├── logs/                      # Application logs
├── index.js                   # Main server entry point
├── ecosystem.config.js        # PM2 configuration
├── make-admin.js             # Admin user creation script
└── package.json              # Dependencies and scripts
```

## Key Features

### User Management
- User registration and authentication
- Google OAuth integration
- User profiles and statistics
- Role-based access control (admin/user)

### Product Management
- Product CRUD operations
- Category management
- Pricing and inventory
- Product search and filtering

### Order Management
- Order creation and tracking
- Payment method handling
- Order status updates
- User order history

### Settings Management
- Application configuration
- Currency settings
- General app settings

## Environment Variables

Create a `.env` file in the server root with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/your-database-name

# Server
PORT=5000
NODE_ENV=production

# Add other environment variables as needed
```

## Available Scripts

```bash
# Start the server
npm start

# Development with PM2
npm run dev

# Production with PM2
npm run prod

# Stop PM2 process
npm run stop

# Restart PM2 process
npm run restart

# Delete PM2 process
npm run delete

# Check PM2 status
npm run status

# View PM2 logs
npm run logs

# PM2 monitor
npm run monitor

# Deploy (stop, delete, prod)
npm run deploy
```

## API Endpoints

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get single user
- `GET /api/users/google/:googleId` - Get user by Google ID
- `GET /api/users/stats` - Get user statistics
- `POST /api/users` - Create new user
- `POST /api/users/sync` - Sync user from Firebase
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products/create-product` - Create new product
- `PUT /api/products/edit/:id` - Update product
- `DELETE /api/products/delete/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/user/:userId` - Get user orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Settings
- `GET /api/settings` - Get application settings
- `POST /api/settings/create-settings` - Create settings
- `PUT /api/settings/edit/:id` - Update settings

## Git Integration

The repository is now connected to:
- **Remote Origin**: https://github.com/SakarKhadka-Personal/node-aliensubs.git
- **Branch**: main
- **Status**: Successfully merged with existing code

## Database Models

### User Model
- `name`: User's full name
- `email`: User's email address
- `googleId`: Google OAuth ID
- `photoURL`: Profile picture URL
- `role`: User role (user/admin)
- `status`: Account status (active/inactive/suspended)
- `phone`: Phone number
- `lastLogin`: Last login timestamp
- `createdAt`/`updatedAt`: Timestamps

### Product Model
- `title`: Product name
- `description`: Product description
- `basePrice`/`maxPrice`: Price range
- `currencyName`: Currency type
- `category`: Product category
- `discount`: Discount percentage
- `coverImage`: Product image URL
- `isLoginRequired`: Login requirement flag
- `placeholderUID`/`placeholderUsername`: Placeholder data
- `productQuantity`: Array of quantity/price pairs

### Order Model
- `userId`: Firebase UID of the user
- `order`: Order details object
- `paymentMethod`: Payment method used
- `paymentScreenshot`: Payment proof URL
- `status`: Order status (pending/processing/confirmed/shipped/delivered/cancelled)
- `createdAt`: Order creation timestamp

### Settings Model
- `appName`: Application name
- `appCurrency`: Default currency

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Request timeout**: 10-second timeout for slow connections
- **Compression**: Gzip compression enabled
- **Input validation**: Mongoose validation
- **Error handling**: Global error handling middleware

## Logging

- **PM2 Logs**: Configured in ecosystem.config.js
- **Log Files**: 
  - `logs/combined.log`: All logs
  - `logs/out.log`: Standard output
  - `logs/error.log`: Error logs

## Admin Setup

Use the `make-admin.js` script to create an admin user:

```bash
node make-admin.js
```

This will create or update the user with email `khadka.sakar10@gmail.com` to have admin privileges.

## Next Steps

1. **Configure Environment**: Set up your `.env` file with proper database connection
2. **Database Setup**: Ensure MongoDB is running and accessible
3. **Testing**: Test all API endpoints
4. **Deployment**: Configure production environment settings
5. **Monitoring**: Set up proper logging and monitoring

## Support

For issues related to the alien subs integration or server functionality, please refer to the original repository or create an issue in the project repository.

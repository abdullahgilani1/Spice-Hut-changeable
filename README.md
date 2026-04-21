# Spice Hut - Restaurant Ordering Platform

A full-stack restaurant ordering platform built with React, Node.js, Express, and MongoDB. Features include online ordering, menu management, branch management, customer loyalty points, and admin dashboard.

🌐 **Live Demo**: [https://spicehutcanada.org](https://spicehutcanada.org)

## Features

### Customer Features
- Browse menu by categories
- Search menu items
- Shopping cart with real-time updates
- User authentication (Email/SMS OTP verification)
- Multiple delivery addresses management
- Loyalty points system (100 points = $1 discount)
- Order history tracking
- Cash on delivery payment
- Pickup or home delivery options
- Geolocation-based nearest branch detection

### Admin Features
- Comprehensive dashboard with analytics
- Order management (Pending, Processing, Delivered)
- Menu item management with image uploads
- Category management
- Branch management
- Customer management
- Admin user management
- Real-time order tracking
- Customer contact information in orders

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- Tailwind CSS
- React Icons
- Vite

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt for password hashing
- Multer for file uploads
- Cloudinary for image storage
- Nodemailer for email notifications
- Twilio for SMS notifications

## Project Structure

```
spice-hut/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Database scripts
│   ├── uploads/         # Local file uploads
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── Admin-Frontend/    # Admin panel
│   │   ├── User-Frontend/     # Customer interface
│   │   ├── authentication/    # Auth pages
│   │   ├── components/        # Shared components
│   │   ├── contexts/          # React contexts
│   │   └── services/          # API services
│   └── vite.config.js
├── .env                 # Environment variables
└── package.json
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- Cloudinary account (for image storage)
- Google Maps API key (for geolocation)
- Twilio account (for SMS notifications)
- Email service credentials (for email notifications)

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/spice-hut.git
cd spice-hut
```

2. Install dependencies
```bash
npm install
cd frontend && npm install
cd ..
```

3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Email Service
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
SENDER_EMAIL=your_email@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

4. Update frontend API configuration

Edit `frontend/src/services/api.js` and set the baseURL:
```javascript
baseURL: 'http://localhost:5000/api'  // For development
```

5. Seed initial data (optional)

```bash
node backend/scripts/seedBranches.js
```

## Running the Application

### Development Mode

1. Start the backend server:
```bash
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### Production Mode

1. Build the frontend:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The application will serve both frontend and backend from the same port (default: 5000).

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/verify-user` - Verify user for password reset
- `POST /api/auth/reset-password` - Reset password

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/category/:category` - Get items by category
- `GET /api/menu/search?q=query` - Search menu items
- `POST /api/menu` - Create menu item (Admin)
- `PUT /api/menu/:id` - Update menu item (Admin)
- `DELETE /api/menu/:id` - Delete menu item (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get user orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/customer/:customerId` - Get customer orders (Admin)
- `PATCH /api/orders/:id/status` - Update order status (Admin)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Change password
- `GET /api/profile/addresses` - Get addresses
- `POST /api/profile/addresses` - Add address
- `PUT /api/profile/addresses/:id` - Update address
- `DELETE /api/profile/addresses/:id` - Delete address

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/by-city?city=name` - Get branch by city
- `POST /api/branches` - Create branch (Admin)
- `PUT /api/branches/:id` - Update branch (Admin)
- `DELETE /api/branches/:id` - Delete branch (Admin)

### Admin
- `GET /api/admins/stats` - Get dashboard statistics
- `GET /api/admins` - Get all admins
- `POST /api/admins` - Add admin
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin

### Customers
- `GET /api/customers` - Get all customers (Admin)
- `DELETE /api/customers/:id` - Delete customer (Admin)

## Database Models

- **User** - Customer and admin accounts
- **MenuItem** - Menu items with categories
- **Category** - Menu categories
- **Order** - Customer orders (multi-collection per branch)
- **OrderCounter** - Sequential order ID generator
- **Branch** - Restaurant branch locations
- **Content** - Site content (About, Contact, Policies)

## Key Features Implementation

### Loyalty Points System
- Customers earn 1 point per $1 spent (pre-tax)
- 100 points = $1 discount
- Points automatically applied at checkout
- Points deducted only after order confirmation

### Multi-Branch Order Management
- Orders stored in separate collections per branch city
- Automatic branch detection based on customer location
- Distance Matrix API for nearest branch calculation

### Image Management
- All images stored on Cloudinary
- Automatic cleanup of old images on update/delete
- Organized folder structure: `spice-hut/menu-items/` and `spice-hut/categories/`

### OTP Verification
- Email and SMS OTP support
- Unverified users auto-deleted after 24 hours
- Login blocked until email verified

### Performance Optimizations
- Database indexes on frequently queried fields
- Aggregation pipelines for complex queries
- Pagination for large datasets
- Parallel API calls on frontend
- Lazy loading for order history

## Deployment

### Production Configuration

1. Update environment variables for production:
```env
FRONTEND_URL=https://spicehutcanada.com
```

2. Update CORS in `backend/server.js`:
```javascript
app.use(cors({
  origin: 'https://spicehutcanada.com',
  credentials: true,
}));
```

3. Update API baseURL in `frontend/src/services/api.js`:
```javascript
baseURL: 'https://spicehutcanada.com/api'
```

4. Build and deploy:
```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Install dependencies and build frontend
- `npm start` - Start backend server
- `node backend/scripts/seedBranches.js` - Seed branch data
- `node backend/scripts/fixOrderIndexes.js` - Fix order indexes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please contact: innovatehubofc@gmail.com

## Acknowledgments

- React and Vite for the frontend framework
- Express.js for the backend framework
- MongoDB for the database
- Cloudinary for image hosting
- Tailwind CSS for styling

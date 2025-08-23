# 🚗 Ride Booking API

A comprehensive, secure, and scalable backend API for a ride booking system similar to Uber or Lyft. Built with Express.js, MongoDB, and JWT authentication, featuring role-based access control and complete ride lifecycle management.

## 🌟 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (Admin, Rider, Driver)
- Secure password hashing with bcrypt
- Account status management (active, blocked, suspended)

### 👥 User Management
- User registration and profile management
- Admin dashboard for user oversight
- Block/unblock user functionality
- Comprehensive user statistics

### 🚘 Driver Management
- Driver registration with vehicle information
- Admin approval workflow for drivers
- Real-time availability status (online/offline/busy)
- Location tracking and nearby driver discovery
- Earnings tracking and history

### 🛣️ Ride Management
- Complete ride lifecycle: request → accept → pickup → transit → complete
- Real-time ride status updates
- Intelligent ride matching system
- Cancellation handling with proper restrictions
- Ride history and statistics
- Fare calculation system

### 📊 Admin Dashboard
- System-wide statistics and analytics
- User and driver management
- Ride monitoring and oversight
- Revenue tracking

## 🏗️ Architecture



### Database Models
- **User**: Core user information with role-based fields
- **Driver**: Extended driver profile with vehicle info and earnings
- **Ride**: Complete ride information with status tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ride-booking-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ride-booking-api

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Application Settings
BCRYPT_ROUNDS=12
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Headers
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout user

#### Users (Admin Only)
- `GET /users` - Get all users with pagination
- `GET /users/statistics` - Get user statistics
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id/status` - Block/unblock user
- `DELETE /users/:id` - Delete user

#### Drivers
- `GET /drivers` - Get all drivers (Admin)
- `GET /drivers/statistics` - Get driver statistics (Admin)
- `PATCH /drivers/:id/status` - Approve/reject driver (Admin)
- `GET /drivers/profile` - Get driver profile (Driver)
- `PATCH /drivers/availability` - Update availability (Driver)
- `PATCH /drivers/location` - Update location (Driver)
- `GET /drivers/earnings` - Get earnings history (Driver)
- `GET /drivers/nearby-rides` - Get nearby ride requests (Driver)

#### Rides
- `POST /rides/request` - Request a ride (Rider)
- `POST /rides/:id/accept` - Accept ride (Driver)
- `PATCH /rides/:id/status` - Update ride status (Driver)
- `PATCH /rides/:id/cancel` - Cancel ride
- `GET /rides/active` - Get current active ride
- `GET /rides/history` - Get ride history
- `GET /rides/:id` - Get ride details
- `GET /rides` - Get all rides (Admin)
- `GET /rides/admin/statistics` - Get ride statistics (Admin)

### Request Examples

#### User Registration
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "rider"
}
```

#### Driver Registration
```json
POST /api/auth/register
{
  "name": "Jane Driver",
  "email": "jane@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "driver",
  "licenseNumber": "DL123456789",
  "vehicleType": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "plateNumber": "ABC123",
    "color": "White"
  }
}
```

#### Apply for Driver Role (Rider to Driver)
```json
PUT /api/auth/profile
{
  "applyForDriver": true,
  "licenseNumber": "DL123456789",
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "plateNumber": "ABC123",
    "color": "White"
  }
}
```

#### Request Ride
```json
POST /api/rides/request
{
  "pickupLocation": {
    "address": "123 Main St, City, State",
    "coordinates": [-74.006, 40.7128]
  },
  "destinationLocation": {
    "address": "456 Park Ave, City, State",
    "coordinates": [-73.9712, 40.7831]
  },
  "notes": "Please call when you arrive"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Role-Based Access Control**: Granular permissions for different user types
- **Input Validation**: Comprehensive validation using express-validator
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS settings
- **Error Handling**: Secure error responses without sensitive information

## 🧪 Testing

The API can be tested using tools like:
- **Postman**: Import the provided collection
- **curl**: Command-line testing
- **Insomnia**: REST client testing

### Sample Test Flow

1. **Register Admin** (manually create in database)
2. **Register Rider**: `POST /auth/register`
3. **Register Driver**: `POST /auth/register` with driver info
4. **Admin approves driver**: `PATCH /drivers/:id/status`
5. **Driver goes online**: `PATCH /drivers/availability`
6. **Rider requests ride**: `POST /rides/request`
7. **Driver accepts ride**: `POST /rides/:id/accept`
8. **Driver updates status**: `PATCH /rides/:id/status`
9. **Complete ride flow**: pickup → transit → complete

## 🌐 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ridebooking
JWT_SECRET=your-super-secure-production-secret
BCRYPT_ROUNDS=12
```

### Docker Support (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Future Enhancements

- **Real-time Communication**: WebSocket integration for live updates
- **Payment Integration**: Stripe/PayPal payment processing
- **Geolocation Services**: Google Maps integration
- **Push Notifications**: Mobile app notifications
- **Rating System**: User and driver rating system
- **Advanced Analytics**: Detailed reporting and insights
- **Multi-language Support**: Internationalization
- **API Rate Limiting**: Prevent abuse with rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ using Node.js, Express.js, and MongoDB**
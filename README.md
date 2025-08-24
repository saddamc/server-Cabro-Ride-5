# 🚗 Ride Booking API
A comprehensive, secure, and scalable backend API for a ride booking system similar to Uber or Lyft. Built with Express.js, MongoDB, and JWT authentication, featuring role-based access control and complete ride lifecycle management.

# My Opinion
In this project i face lot of challenge, then i learn many thinks. Also some issue close to solve but i unsuccessful. I realized now in the backend doing everything.


### Database Models
- **User**: Core user information with role-based fields
- **Ride**: Complete ride information with status tracking
- **Driver**: Extended driver profile with vehicle info and earnings
- **Payment**: Complete payment information 


## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

#### Auth
- `POST /auth/refresh-token` => Get Net Token
- `POST /auth/logout` => User Logout
- `POST /auth/change-password` - Change password
  ```json
  {
    "oldPassword": "123456sa",
    "newPassword": "123456"
  }
  ```
- `POST /auth/set-password` - Set password (For Google account)
  ```json
  {
     "password": "123456"
  }
  ```
- `POST /auth/forgot-password` - Forgot Password
  ```json
  {
    "email": "john@gmail.com",
  }
  ```
- `PATCH /auth/verify-user` - User Verification
  ```json
  {
    "email": "john@gmail.com",
  }
  ```
- `GET /auth/google` - Google Login (in browser)



#### Users 
- `POST /users/register` - New User Register
  ```json
  {
  "name": "Tanvir Hossain",
  "email": "c@gmail.com",
  "password": "123456Abc@",
  "phone": "01829370688",
  "address": "Dhaka, Bangladesh"
  }
  ```
- `POST /users/login` - User Login
- `GET /users/me` - User Profile/Details
  
- `GET /users/:id` - Get user by ID (Admin Only)
- `PATCH /users/update/:id` - User Update (User & Admin)
  ```json
  {
  "name": "Tanvir Hossain",
  "phone": "01829370688",
  "address": "Dhaka, Bangladesh"
  }
  ```
- `GET /users` - Get All Users (Admin only)
- `POST /users/block/:id` - User Blocked/Active (Admin only)

#### Rides
- `POST /rides/request` - Request a ride (Rider)
- `PATCH /rides/:id/cancel` - Cancel ride (Rider)
- `GET /rides/me` - All ride (Rider, Driver)
- `GET /rides/rating/:id` - Ride giving Rating (Rider)
  
- `PATCH /rides` - Get all ride history (Admin only)


#### Drivers
- `POST /drivers/apply`       - Apply for Driver (Driver)
- `POST /drivers/available`   - Driver shift => online/offline (Driver)
- `POST /drivers/accept-ride/:id`   - Accept ride (Driver)
- `PATCH /drivers/reject-ride/:id`  - Reject ride (Driver)
- `PATCH /drivers/status/:id` - Update ride pick_up => transit => completed (Driver)
- `GET /drivers/earnings`     - Get earnings history (Driver)
- `GET /drivers/nearby?lng=90.392518&lat=23.790331&distance=5` - Get nearby ride requests (Driver)
- `PATCH /drivers/update-me`  - Update driver profile (Driver)
- `PATCH /drivers/rating/:id` - Driver Rating to Rider (Driver)
- 
- `POST /drivers/approved-driver/:id` - Approved applying Driver (Admin only)
- `POST /drivers/suspend/:id`         - Driver Suspend/Approved (Admin only)


#### Admin  
- `GET /admin/analytics`       -  Dashboard admin









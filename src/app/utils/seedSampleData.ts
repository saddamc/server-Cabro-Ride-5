import bcryptjs from "bcryptjs";
import { envVars } from "../config/env";
import { Ride } from "../modules/rider/rider.model";
import { IAuthProvider, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

export const seedSampleData = async () => {
  try {
    console.log("🌱 Seeding sample data...");

    // Check if sample data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 1) { // More than just super admin
      console.log("✅ Sample data already exists, skipping seeding");
      return;
    }

    const hashedPassword = await bcryptjs.hash("password123", Number(envVars.BCRYPT_SALT_ROUND));

    // Sample Riders
    const riders = [
      {
        name: "John Doe",
        email: "rider1@example.com",
        phone: "+8801712345678",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 5,
      },
      {
        name: "Jane Smith",
        email: "rider2@example.com",
        phone: "+8801712345679",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 3,
      },
      {
        name: "Mike Johnson",
        email: "rider3@example.com",
        phone: "+8801712345680",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 8,
      },
      {
        name: "Sarah Wilson",
        email: "rider4@example.com",
        phone: "+8801712345681",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 2,
      },
      {
        name: "David Brown",
        email: "rider5@example.com",
        phone: "+8801712345682",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 6,
      },
      {
        name: "Lisa Davis",
        email: "rider6@example.com",
        phone: "+8801712345683",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 4,
      },
      {
        name: "Tom Anderson",
        email: "rider7@example.com",
        phone: "+8801712345684",
        role: Role.rider,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
        totalRides: 7,
      },
      {
        name: "Emily Taylor",
        email: "rider8@example.com",
        phone: "+8801712345685",
        role: Role.rider,
        password: hashedPassword,
        isActive: "INACTIVE",
        isVerified: true,
        totalRides: 1,
      },
    ];

    // Sample Drivers
    const drivers = [
      {
        name: "Robert Garcia",
        email: "driver1@example.com",
        phone: "+8801812345678",
        role: Role.driver,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
      },
      {
        name: "Maria Rodriguez",
        email: "driver2@example.com",
        phone: "+8801812345679",
        role: Role.driver,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
      },
      {
        name: "Carlos Martinez",
        email: "driver3@example.com",
        phone: "+8801812345680",
        role: Role.driver,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
      },
      {
        name: "Ana Lopez",
        email: "driver4@example.com",
        phone: "+8801812345681",
        role: Role.driver,
        password: hashedPassword,
        isActive: "ACTIVE",
        isVerified: true,
      },
    ];

    // Create auth providers for all users
    const createAuthProvider = (email: string): IAuthProvider => ({
      provider: "credentials",
      providerId: email,
    });

    // Create riders
    const createdRiders = [];
    for (const rider of riders) {
      const authProvider = createAuthProvider(rider.email);
      const riderData = {
        ...rider,
        auths: [authProvider],
      };
      const createdRider = await User.create(riderData);
      createdRiders.push(createdRider);
    }

    // Create drivers
    const createdDrivers = [];
    for (const driver of drivers) {
      const authProvider = createAuthProvider(driver.email);
      const driverData = {
        ...driver,
        auths: [authProvider],
      };
      const createdDriver = await User.create(driverData);
      createdDrivers.push(createdDriver);
    }

    // Create sample rides
    const sampleRides = [
      {
        rider: createdRiders[0]._id,
        driver: createdDrivers[0]._id,
        pickupLocation: {
          address: "Dhanmondi, Dhaka",
          coordinates: [90.3773, 23.7461],
        },
        dropoffLocation: {
          address: "Gulshan, Dhaka",
          coordinates: [90.4152, 23.7925],
        },
        status: "completed",
        fare: 150,
        distance: 5.2,
        duration: 15,
        pickedUp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completed: new Date(Date.now() - 1.75 * 60 * 60 * 1000), // 1.75 hours ago
      },
      {
        rider: createdRiders[1]._id,
        driver: createdDrivers[1]._id,
        pickupLocation: {
          address: "Banani, Dhaka",
          coordinates: [90.4066, 23.7937],
        },
        dropoffLocation: {
          address: "Uttara, Dhaka",
          coordinates: [90.3995, 23.8759],
        },
        status: "completed",
        fare: 200,
        distance: 8.1,
        duration: 25,
        pickedUp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        completed: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
      },
      {
        rider: createdRiders[2]._id,
        driver: createdDrivers[2]._id,
        pickupLocation: {
          address: "Mirpur, Dhaka",
          coordinates: [90.3654, 23.8223],
        },
        dropoffLocation: {
          address: "Mohammadpur, Dhaka",
          coordinates: [90.3563, 23.7574],
        },
        status: "in_progress",
        fare: 120,
        distance: 4.5,
        duration: 12,
        pickedUp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        completed: null,
      },
      {
        rider: createdRiders[3]._id,
        driver: createdDrivers[0]._id,
        pickupLocation: {
          address: "Shyamoli, Dhaka",
          coordinates: [90.3742, 23.7727],
        },
        dropoffLocation: {
          address: "Farmgate, Dhaka",
          coordinates: [90.3873, 23.7561],
        },
        status: "completed",
        fare: 100,
        distance: 3.8,
        duration: 10,
        pickedUp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        completed: new Date(Date.now() - 5.75 * 60 * 60 * 1000), // 5.75 hours ago
      },
      {
        rider: createdRiders[4]._id,
        driver: createdDrivers[1]._id,
        pickupLocation: {
          address: "Tejgaon, Dhaka",
          coordinates: [90.4004, 23.7597],
        },
        dropoffLocation: {
          address: "Badda, Dhaka",
          coordinates: [90.4255, 23.7809],
        },
        status: "completed",
        fare: 180,
        distance: 6.2,
        duration: 18,
        pickedUp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        completed: new Date(Date.now() - 7.5 * 60 * 60 * 1000), // 7.5 hours ago
      },
    ];

    for (const ride of sampleRides) {
      await Ride.create(ride);
    }

    console.log(`✅ Sample data seeded successfully:`);
    console.log(`   - ${riders.length} riders created`);
    console.log(`   - ${drivers.length} drivers created`);
    console.log(`   - ${sampleRides.length} rides created`);

  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
  }
};
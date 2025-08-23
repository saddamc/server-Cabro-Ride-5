import { Driver } from "../driver/driver.model";
import { Ride } from "../rider/rider.model";
import { User } from "../user/user.model";

;

const getAnalytics = async () => {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: "ACTIVE" });
    const blockedUsers = await User.countDocuments({ isActive: "BLOCKED" });

    const totalDrivers = await Driver.countDocuments();
    const approvedDrivers = await Driver.countDocuments({ status: "approved" });
    const pendingDrivers = await Driver.countDocuments({ status: "pending" });

    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: "completed" });
    const cancelledRides = await Ride.countDocuments({ status: "cancelled" });

    return {
        users: { totalUsers, activeUsers, blockedUsers },
        drivers: { totalDrivers, approvedDrivers, pendingDrivers },
        rides: { totalRides, completedRides, cancelledRides }   
    };
};

export const AdminService = {
    getAnalytics
};

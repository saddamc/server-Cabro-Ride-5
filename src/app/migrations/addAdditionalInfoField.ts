// import { Driver } from '../modules/driver/driver.model';

// /**
//  * Migration script to add additionalInfo field to existing driver documents
//  */
// export const addAdditionalInfoField = async () => {
//   try {
//     console.log('Running migration: addAdditionalInfoField');
    
//     // Find all drivers that don't have the additionalInfo field
//     const drivers = await Driver.find({ additionalInfo: { $exists: false } });
    
//     if (drivers.length === 0) {
//       console.log('No drivers need migration - all have additionalInfo field');
//       return;
//     }
    
//     console.log(`Found ${drivers.length} drivers that need the additionalInfo field`);
    
//     // Add empty additionalInfo field to each driver
//     const updates = drivers.map(driver => {
//       return Driver.updateOne(
//         { _id: driver._id },
//         { 
//           $set: { 
//             additionalInfo: {
//               experience: '',
//               references: ''
//             } 
//           } 
//         }
//       );
//     });
    
//     // Execute all updates
//     await Promise.all(updates);
    
//     console.log('Successfully added additionalInfo field to all drivers');
//   } catch (error) {
//     console.error('Error in addAdditionalInfoField migration:', error);
//   }
// };
/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    console.log("Connected to DB!");

    server = app.listen(envVars.PORT, () => {
      console.log(`Server is listening to port ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await startServer();
  await seedSuperAdmin()
})()

// signal termination => sigterm (we can't see the error in visually)
process.on("SIGTERM", () => {
  console.log(`
=======================================
📢 SIGTERM received!
Shutting down the server gracefully...
=======================================
`);


  if (server) {
    server.close(() => {
      process.exit(1); // node.js server
    });
  }

  process.exit(1);
});
// that why we use
process.on("SIGINT", () => {
  console.log(`
=======================================
📢 SIGTERM received!
Shutting down the server gracefully...
=======================================
`);



  if (server) {
    server.close(() => {
      //express app server
      process.exit(1); // node.js server
    });
  }

  process.exit(1);
});




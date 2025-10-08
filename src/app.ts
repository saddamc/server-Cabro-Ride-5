import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";

const app = express();

app.use(expressSession(
  {
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }
));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser()); 
app.use(express.json()); 
app.set("trust proxy", 1);
app.use(express.urlencoded({extended: true}))

app.use(cors({
  origin: ["https://cabro.vercel.app", "http://localhost:5173"],
  credentials: true,
}));




// Routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Tour Management system Backend",
  });
});


// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;








// ! version update 
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import express, { Request, Response } from "express";
// import passport from "passport";
// import { envVars } from "./app/config/env";
// import "./app/config/passport";
// import globalErrorHandler from "./app/middlewares/globalErrorHandler";
// import notFound from "./app/middlewares/notFound";
// import { router } from "./app/routes";

// const app = express();

// // Trust proxy for cookies if needed
// app.set("trust proxy", 1);

// // ✅ CORS
// app.use(
//   cors({
//     origin: envVars.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // ✅ Passport (JWT strategy only)
// app.use(passport.initialize());

// // ✅ Routes
// app.get("/", (req: Request, res: Response) => {
//   res.status(200).json({
//     message: "Welcome to Tour Management System Backend",
//   });
// });

// app.use("/api/v1", router);

// // ✅ Error handlers
// app.use(globalErrorHandler);
// app.use(notFound);

// export default app;


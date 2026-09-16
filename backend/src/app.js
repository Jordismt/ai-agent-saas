import express from "express";
import cors from "cors";
import helmet from "helmet";

import { supabase } from "./infrastructure/database/supabase.js";
import businessRoutes from "./modules/businesses/presentation/businessRoutes.js";
import { authMiddleware } from "./shared/middleware/authMiddleware.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/health/supabase", async (req, res) => {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }

  res.json({
    status: "ok",
    database: "connected",
  });
});

app.get("/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});

app.use("/businesses", businessRoutes);

app.use(errorHandler);

export default app;

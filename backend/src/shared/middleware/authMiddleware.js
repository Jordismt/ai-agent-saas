import { createSupabaseClient } from "../../infrastructure/database/supabase.js";

export async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing authentication token",
      });
    }

    const token = authorization.replace("Bearer ", "");

    const supabase = createSupabaseClient(token);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    req.user = user;
    req.supabase = supabase;

    next();
  } catch (error) {
    next(error);
  }
}

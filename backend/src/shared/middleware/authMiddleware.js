import { createSupabaseClient, createSupabaseServerClient } from "../../infrastructure/database/supabase.js";

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

    // Rutas permitidas durante la eliminación.
    const allowedDuringDeletion = ["/account/delete", "/account/summary"];

    const currentPath = req.originalUrl.split("?")[0];

    // Comprobar si existe una eliminación pendiente.
    if (!allowedDuringDeletion.includes(currentPath)) {
      const { data: deletion, error: deletionError } = await createSupabaseServerClient()
        .from("account_deletion_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (deletionError) {
        throw deletionError;
      }

      // Bloquear las demás operaciones mientras
      // la cuenta está pendiente de eliminación.
      if (deletion && deletion.status !== "completed") {
        return res.status(423).json({
          error:
            "Tu cuenta está pendiente de eliminación. " +
            "Accede a Configuración para reintentar el proceso.",
        });
      }
    }

    // Usuario autenticado.
    req.user = user;
    req.supabase = supabase;

    next();
  } catch (error) {
    next(error);
  }
}

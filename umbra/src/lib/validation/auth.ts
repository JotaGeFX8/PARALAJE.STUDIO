import { z } from "zod";

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Escribe tu correo.")
  .max(254, "Correo demasiado largo.")
  .email("Ese correo no parece válido.");

export const password = z
  .string()
  .min(10, "Mínimo 10 caracteres.")
  .max(72, "Máximo 72 caracteres.")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9\W_]/.test(v), "Combina letras con números o símbolos.");

export const signUpSchema = z.object({
  email,
  password,
  terms: z.literal("on", { error: "Debes aceptar las normas y los términos." }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña.").max(72),
});

export const resetSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden." });

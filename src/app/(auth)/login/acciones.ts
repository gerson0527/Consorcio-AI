"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth";
import { limitar } from "@/lib/limite";
import { ipSolicitud } from "@/lib/solicitud";
import { registrarAuditoria } from "@/modules/auditoria";

const esquema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function ingresar(formData: FormData) {
  const datos = esquema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const ip = await ipSolicitud();
  if (!datos.success || !limitar(`login:${ip ?? "local"}`, 5, 15 * 60 * 1000)) {
    redirect("/login?error=1");
  }
  try {
    await signIn("credentials", {
      email: datos.data.email.toLowerCase(),
      password: datos.data.password,
      redirectTo: "/clientes",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await registrarAuditoria({
        accion: "login_fallido",
        objetoTipo: "User",
        detalle: { ip },
        ip,
      }).catch(() => undefined);
      redirect("/login?error=1");
    }
    throw error;
  }
}

export async function salir() {
  await signOut({ redirectTo: "/login" });
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import type { Rol } from "@/lib/autorizacion";
import { verificarClave } from "@/lib/claves";
import { prisma } from "@/lib/prisma";

const esquemaIngreso = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const datos = esquemaIngreso.safeParse(credentials);
        if (!datos.success) return null;
        const usuario = await prisma.user.findUnique({
          where: { email: datos.data.email.toLowerCase() },
        });
        if (!usuario?.activo) return null;
        const valida = await verificarClave(datos.data.password, usuario.passwordHash);
        if (!valida) return null;
        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.rol = token.rol;
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    rol: Rol;
  }
  interface Session {
    user: {
      id: string;
      rol: Rol;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}

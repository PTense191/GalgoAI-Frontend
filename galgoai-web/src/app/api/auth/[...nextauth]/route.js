import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account", //
          hd: "tectijuana.edu.mx", // Dominio permitido
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Verificación del dominio
      const isInstitutional = profile?.hd === "tectijuana.edu.mx";
      if (!isInstitutional) return false;

      try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios?email=${profile.email}`);
      const data = await res.json();

      if (!data || !data.exists) {
        // Si no existe, crear el usuario
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: profile.email,
            nombre: profile.name,
          })
        });
      }
    } catch (err) {
      console.error("Error registrando usuario:", err);
      // return false; // bloquear si falla, debe desactivarse si es host local pq sino peta por el api
    }

    return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

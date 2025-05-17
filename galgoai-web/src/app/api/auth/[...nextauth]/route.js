import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          hd: "tectijuana.edu.mx", // Dominio permitido
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Verificación adicional del dominio
      return profile.hd === "tectijuana.edu.mx";
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

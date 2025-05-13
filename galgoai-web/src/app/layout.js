// src/app/layout.js
import "./globals.css";

export const metadata = {
  title: "GalgoAI Chat",
  description: "Chat personalizado para la universidad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}

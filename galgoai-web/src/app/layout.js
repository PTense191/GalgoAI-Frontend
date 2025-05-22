// src/app/layout.js
import "./globals.css";
import SessionWrapper from "./SessionWrapper";

export const metadata = {
  title: "GalgoAI Chat",
  description: "Chat personalizado para la universidad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}

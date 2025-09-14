import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../utils/auth";
import { FaGithub } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Green Energy",
  description: "Green Energy",
  icons: {
    icon: "/energy.ico",
    shortcut: "/energy.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <footer className="relative z-10 py-6 border-t border-teal-500/20 flex items-center justify-center bg-slate-900/40">
            <a
              href="https://github.com/FireFlyDeveloper/Power-Monitoring.git"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-teal-100 hover:text-white transition-colors"
            >
              <FaGithub className="w-6 h-6" />
              <span className="text-sm">GitHub</span>
            </a>
          </footer>
        </body>
      </html>
    </AuthProvider>
  );
}

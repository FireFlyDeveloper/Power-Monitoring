import "../globals.css";

export const metadata = {
  title: "Login",
  description: "Login",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

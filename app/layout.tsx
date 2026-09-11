import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Mensajes WhatsApp',
  description: 'Gestor de envíos automáticos de buenos días',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* CSS de Bootstrap 5 */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        {/* Bootstrap Icons */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-light">
        {children}
      </body>
    </html>
  );
}
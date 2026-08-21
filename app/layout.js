import "./globals.css";

export const metadata = {
  title: "AirConSolution | Servicios de Climatización y Electricidad",
  description:
    "AirConSolution - Expertos en climatización, instalaciones eléctricas y mantenimiento. Servicios rápidos, seguros y garantizados.",
  keywords:
    "climatización, aire acondicionado, electricista, mantenimiento preventivo, bombas de agua, instalaciones eléctricas",
  openGraph: {
    title: "AirConSolution | Servicios de Climatización y Electricidad",
    description:
      "Expertos en climatización, instalaciones eléctricas y mantenimiento para hogares y empresas.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

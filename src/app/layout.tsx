import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Mapa Electoral Colombia 2026',
  description: 'Análisis interactivo de resultados presidenciales por municipio y departamento',
  keywords: ['Colombia', 'elecciones', 'presidenciales', 'mapa electoral', 'Cepeda', 'De la Espriella'],
  openGraph: {
    title: 'Mapa Electoral Colombia 2026',
    description: 'Análisis interactivo de resultados electorales presidenciales',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="bg-[#F0F2F5] text-gray-900 min-h-full flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-397057395" />
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function ColombiaFlag({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="rounded-full overflow-hidden shrink-0"
      style={{ display: 'block' }}
    >
      <rect x="0" y="0" width="32" height="16" fill="#FCD116" />
      <rect x="0" y="16" width="32" height="8" fill="#003893" />
      <rect x="0" y="24" width="32" height="8" fill="#CE1126" />
    </svg>
  )
}

function ColombiaBadge() {
  return (
    <span className="text-xl leading-none select-none" aria-hidden="true">🇨🇴</span>
  )
}

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <ColombiaFlag size={32} />
          <div className="hidden sm:block">
            <p className="text-gray-900 font-semibold text-sm leading-tight">Mapa Electoral</p>
            <p className="text-gray-500 text-xs leading-tight">Colombia 2026</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            href="/"
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5',
              isHome
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <ColombiaBadge />
            <span className="hidden sm:inline">Mapa</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-500 text-xs hidden sm:inline">Cepeda</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-2" />
            <span className="text-gray-500 text-xs hidden sm:inline">De la Espriella</span>
          </div>
        </nav>
      </div>
    </header>
  )
}

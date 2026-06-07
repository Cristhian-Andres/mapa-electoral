import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n)
}

export function formatPct(n: number, decimals = 2): string {
  return `${n.toFixed(decimals)}%`
}

export function getWinnerColor(winnerName: string | null | undefined): string {
  if (!winnerName) return '#9CA3AF'
  if (winnerName.includes('CEPEDA')) return '#2563EB'
  if (winnerName.includes('ESPRIELLA')) return '#DC2626'
  return '#6B7280'
}

export function getMarginColor(marginPct: number, winner: string | null): string {
  const isBlue = winner?.includes('CEPEDA')
  const intensity = Math.min(marginPct / 30, 1)

  if (isBlue) {
    const b = Math.round(200 + intensity * 55)
    const rg = Math.round(180 - intensity * 150)
    return `rgb(${rg}, ${rg}, ${b})`
  } else {
    const r = Math.round(200 + intensity * 55)
    const gb = Math.round(180 - intensity * 150)
    return `rgb(${r}, ${gb}, ${gb})`
  }
}

export function calcMarginLabel(margin: number, winnerName: string | null): string {
  if (!winnerName) return 'Sin datos'
  const winner = winnerName.includes('CEPEDA') ? 'Cepeda' : 'De la Espriella'
  return `${winner} +${formatNumber(margin)}`
}

// Normalize department name for map matching
export function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Map from GeoJSON department names to database names
export const DEPT_NAME_MAPPING: Record<string, string> = {
  'AMAZONAS': 'AMAZONAS',
  'ANTIOQUIA': 'ANTIOQUIA',
  'ARAUCA': 'ARAUCA',
  'ATLANTICO': 'ATLANTICO',
  'BOGOTA': 'BOGOTA D.C.',
  'BOGOTA D.C.': 'BOGOTA D.C.',
  'BOLIVAR': 'BOLIVAR',
  'BOYACA': 'BOYACA',
  'CALDAS': 'CALDAS',
  'CAQUETA': 'CAQUETA',
  'CASANARE': 'CASANARE',
  'CAUCA': 'CAUCA',
  'CESAR': 'CESAR',
  'CHOCO': 'CHOCO',
  'CORDOBA': 'CORDOBA',
  'CUNDINAMARCA': 'CUNDINAMARCA',
  'GUAINIA': 'GUAINIA',
  'GUAVIARE': 'GUAVIARE',
  'HUILA': 'HUILA',
  'LA GUAJIRA': 'LA GUAJIRA',
  'MAGDALENA': 'MAGDALENA',
  'META': 'META',
  'NARINO': 'NARIÑO',
  'NORTE DE SANTANDER': 'NORTE DE SANTANDER',
  'PUTUMAYO': 'PUTUMAYO',
  'QUINDIO': 'QUINDIO',
  'RISARALDA': 'RISARALDA',
  'SAN ANDRES': 'SAN ANDRES',
  'SAN ANDRES Y PROVIDENCIA': 'SAN ANDRES',
  'SANTANDER': 'SANTANDER',
  'SUCRE': 'SUCRE',
  'TOLIMA': 'TOLIMA',
  'VALLE DEL CAUCA': 'VALLE',
  'VALLE': 'VALLE',
  'VAUPES': 'VAUPES',
  'VICHADA': 'VICHADA',
}

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'red' | 'green' | 'gray' | 'yellow'
  className?: string
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
}

export default function StatCard({ label, value, sub, color = 'gray', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border p-4', colorMap[color], className)}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

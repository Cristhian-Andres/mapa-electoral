declare module 'react-simple-maps' {
  import { ReactNode, MouseEvent } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: React.CSSProperties
    children?: ReactNode
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (params: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey: string
    properties: Record<string, unknown>
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseMove?: (e: MouseEvent) => void
    onMouseLeave?: () => void
    onClick?: () => void
  }

  export const ComposableMap: React.FC<ComposableMapProps>
  export const ZoomableGroup: React.FC<ZoomableGroupProps>
  export const Geographies: React.FC<GeographiesProps>
  export const Geography: React.FC<GeographyProps>
}

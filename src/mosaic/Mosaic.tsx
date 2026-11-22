import { useEffect, useRef } from 'react'
import { attach } from './engine'
import './api'

/** Lienzo fijo del mosaico. aria-hidden: el texto real vive en el DOM. */
export default function Mosaic() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => attach(ref.current!), [])
  return <canvas ref={ref} className="mosaic" aria-hidden="true" />
}

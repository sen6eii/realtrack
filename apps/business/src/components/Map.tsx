'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapProps {
  accessToken: string
  initialCenter?: [number, number]
  initialZoom?: number
  height?: string
  markers?: Array<{
    id: string
    coordinates: [number, number]
    popup?: string
    color?: string
  }>
  onMapClick?: (coordinates: [number, number]) => void
  onMarkerClick?: (markerId: string, coordinates: [number, number]) => void
}

export function Map({
  accessToken,
  initialCenter = [-74.0060, 40.7128], // NYC
  initialZoom = 12,
  height = '400px',
  markers = [],
  onMapClick,
  onMarkerClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return

    // Initialize map
    mapboxgl.accessToken = accessToken
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    })

    // Add click handler
    if (onMapClick) {
      map.current.on('click', (e) => {
        const coordinates = [e.lngLat.lng, e.lngLat.lat] as [number, number]
        onMapClick(coordinates)
      })
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
    }
  }, [accessToken, initialCenter, initialZoom, onMapClick])

  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    markers.forEach((markerData) => {
      const el = document.createElement('div')
      el.className = 'w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer'
      el.style.backgroundColor = markerData.color || '#3b82f6'

      const marker = new mapboxgl.Marker(el)
        .setLngLat(markerData.coordinates)
        .addTo(map.current!)

      // Add popup if provided
      if (markerData.popup) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(markerData.popup)
        marker.setPopup(popup)
      }

      // Add click handler
      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(markerData.id, markerData.coordinates)
        })
      }

      markersRef.current.push(marker)
    })

    // Fit map to markers if there are any
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      markers.forEach(marker => bounds.extend(marker.coordinates))
      map.current.fitBounds(bounds, { padding: 50 })
    } else if (markers.length === 1) {
      map.current.flyTo({
        center: markers[0].coordinates,
        zoom: 14,
      })
    }
  }, [markers, onMarkerClick])

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  )
}
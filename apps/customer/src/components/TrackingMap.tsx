'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapProps {
  accessToken: string
  deliveryLocation?: { lat: number; lng: number } | null
  driverLocation?: { lat: number; lng: number } | null
  route?: Array<{ lat: number; lng: number }>
  height?: string
  showTraffic?: boolean
  interactive?: boolean
}

export function TrackingMap({
  accessToken,
  deliveryLocation,
  driverLocation,
  route = [],
  height = '400px',
  showTraffic = false,
  interactive = true,
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
      center: deliveryLocation 
        ? [deliveryLocation.lng, deliveryLocation.lat]
        : [-74.0060, 40.7128], // Default to NYC
      zoom: 13,
      interactive,
    })

    // Add navigation controls if interactive
    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    return () => {
      map.current?.remove()
    }
  }, [accessToken, deliveryLocation, interactive])

  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()

    // Add delivery location marker
    if (deliveryLocation) {
      const deliveryEl = document.createElement('div')
      deliveryEl.className = 'w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center'
      deliveryEl.innerHTML = '<div class="text-white text-lg">📍</div>'

      const deliveryMarker = new mapboxgl.Marker(deliveryEl)
        .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
        .addTo(map.current!)

      // Add popup for delivery location
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2 text-center">
          <div class="font-medium">Delivery Destination</div>
          <div class="text-sm text-gray-600">Your package will be delivered here</div>
        </div>
      `)
      deliveryMarker.setPopup(popup)

      markersRef.current.push(deliveryMarker)
      bounds.extend([deliveryLocation.lng, deliveryLocation.lat])
    }

    // Add driver location marker with animation
    if (driverLocation) {
      const driverEl = document.createElement('div')
      driverEl.className = 'relative'
      driverEl.innerHTML = `
        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping"></div>
        <div class="relative w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <div class="text-white text-sm">🚗</div>
        </div>
      `

      const driverMarker = new mapboxgl.Marker(driverEl)
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current!)

      // Add popup for driver location
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2 text-center">
          <div class="font-medium">Driver Location</div>
          <div class="text-sm text-gray-600">Your driver is currently here</div>
          <div class="text-xs text-blue-600 mt-1">Live tracking</div>
        </div>
      `)
      driverMarker.setPopup(popup)

      markersRef.current.push(driverMarker)
      bounds.extend([driverLocation.lng, driverLocation.lat])
    }

    // Draw route if available
    if (route.length > 1 && map.current.getSource('route')) {
      const routeCoordinates = route.map(point => [point.lng, point.lat])
      
      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxjs.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        })
      } else {
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
            },
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.7,
          },
        })
      }
    }

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 16,
      })
    }
  }, [deliveryLocation, driverLocation, route])

  return (
    <div
      className="w-full rounded-lg overflow-hidden shadow-inner bg-gray-100"
      style={{ height }}
    >
      <div ref={mapContainer} className="w-full h-full" />
      {!accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🗺️</div>
            <p>Map unavailable</p>
          </div>
        </div>
      )}
    </div>
  )
}
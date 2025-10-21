'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapProps {
  accessToken: string
  deliveryLocation?: { lat: number; lng: number } | null
  driverLocation?: { lat: number; lng: number } | null
  driverInfo?: {
    name: string
    vehicleType: string
    licensePlate: string
    phone: string
    rating: number
    status: string
  }
  route?: Array<{ lat: number; lng: number }>
  eta?: string
  distanceRemaining?: number
  height?: string
  showTraffic?: boolean
  interactive?: boolean
  realTimeUpdates?: boolean
}

export function TrackingMap({
  accessToken,
  deliveryLocation,
  driverLocation,
  driverInfo,
  route = [],
  eta,
  distanceRemaining,
  height = '400px',
  showTraffic = false,
  interactive = true,
  realTimeUpdates = true,
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

    // Add driver location marker with animation and detailed info
    if (driverLocation) {
      const driverEl = document.createElement('div')
      driverEl.className = 'relative'
      
      // Enhanced driver marker with status
      const statusColor = driverInfo?.status === 'on_route' ? 'blue' : 
                         driverInfo?.status === 'assigned' ? 'amber' : 'gray'
      
      driverEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-${statusColor}-500 rounded-full animate-ping ${realTimeUpdates ? '' : 'opacity-0'}"></div>
          <div class="relative w-10 h-10 bg-${statusColor}-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div class="text-white text-sm">
              ${driverInfo?.vehicleType === 'motorcycle' ? '🏍️' : 
                driverInfo?.vehicleType === 'bicycle' ? '🚴' : '🚗'}
            </div>
          </div>
          ${realTimeUpdates ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>' : ''}
        </div>
      `

      const driverMarker = new mapboxgl.Marker(driverEl)
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current!)

      // Enhanced popup with driver information
      const popupContent = driverInfo ? `
        <div class="p-3 min-w-64">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold text-gray-900">${driverInfo.name}</div>
            <div class="flex items-center text-sm">
              <span class="text-yellow-500">⭐</span>
              <span class="ml-1 text-gray-600">${driverInfo.rating}</span>
            </div>
          </div>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Vehicle:</span>
              <span class="capitalize">${driverInfo.vehicleType}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">License:</span>
              <span class="font-mono">${driverInfo.licensePlate}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="capitalize text-${statusColor}-600 font-medium">${driverInfo.status.replace('_', ' ')}</span>
            </div>
            ${eta ? `
            <div class="flex justify-between">
              <span class="text-gray-600">ETA:</span>
              <span class="font-medium text-green-600">${eta}</span>
            </div>
            ` : ''}
            ${distanceRemaining ? `
            <div class="flex justify-between">
              <span class="text-gray-600">Distance:</span>
              <span class="font-medium">${distanceRemaining.toFixed(1)} km</span>
            </div>
            ` : ''}
          </div>
          ${driverInfo.phone ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <a href="tel:${driverInfo.phone}" class="flex items-center justify-center w-full bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              <span class="mr-2">📞</span>
              Call Driver
            </a>
          </div>
          ` : ''}
          ${realTimeUpdates ? '<div class="text-xs text-green-600 text-center mt-2">🔴 Live tracking active</div>' : ''}
        </div>
      ` : `
        <div class="p-2 text-center">
          <div class="font-medium">Driver Location</div>
          <div class="text-sm text-gray-600">Your driver is currently here</div>
          <div class="text-xs text-blue-600 mt-1">Live tracking</div>
        </div>
      `
      
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        maxWidth: '300px'
      }).setHTML(popupContent)
      
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
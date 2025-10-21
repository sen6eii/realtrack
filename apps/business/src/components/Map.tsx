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
    icon?: string
    animated?: boolean
  }>
  routes?: Array<{
    id: string
    coordinates: [number, number][]
    color?: string
    width?: number
    opacity?: number
  }>
  onMapClick?: (coordinates: [number, number]) => void
  onMarkerClick?: (markerId: string, coordinates: [number, number]) => void
  showLiveDrivers?: boolean
  driverLocations?: Array<{
    id: string
    name: string
    coordinates: [number, number]
    heading?: number
    status: 'available' | 'on_delivery' | 'offline'
    vehicleType?: string
    lastUpdate: string
  }>
}

export function Map({
  accessToken,
  initialCenter = [-74.0060, 40.7128], // NYC
  initialZoom = 12,
  height = '400px',
  markers = [],
  routes = [],
  onMapClick,
  onMarkerClick,
  showLiveDrivers = false,
  driverLocations = [],
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const routeLayersRef = useRef<string[]>([])
  const driverMarkersRef = useRef<mapboxgl.Marker[]>([])

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

  // Render routes
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return

    // Remove existing route layers
    routeLayersRef.current.forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId)
      }
      if (map.current!.getSource(layerId)) {
        map.current!.removeSource(layerId)
      }
    })
    routeLayersRef.current = []

    // Add new routes
    routes.forEach((route) => {
      const routeId = `route-${route.id}`
      routeLayersRef.current.push(routeId)

      // Add route source
      map.current!.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        },
      })

      // Add route layer
      map.current!.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': route.color || '#3b82f6',
          'line-width': route.width || 4,
          'line-opacity': route.opacity || 0.8,
        },
      })
    })
  }, [routes])

  // Render live drivers
  useEffect(() => {
    if (!map.current || !showLiveDrivers) return

    // Remove existing driver markers
    driverMarkersRef.current.forEach(marker => marker.remove())
    driverMarkersRef.current = []

    driverLocations.forEach((driver) => {
      const el = document.createElement('div')
      el.className = 'relative flex items-center justify-center'
      
      // Driver marker based on status
      const statusColors = {
        available: '#10b981', // green
        on_delivery: '#f59e0b', // amber
        offline: '#6b7280', // gray
      }
      
      const iconHtml = driver.status === 'on_delivery' ? 
        `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>` :
        `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`

      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-2 bg-white rounded-full opacity-20 animate-ping"></div>
          <div class="relative bg-${driver.status === 'available' ? 'green' : driver.status === 'on_delivery' ? 'amber' : 'gray'}-500 rounded-full p-1 border-2 border-white shadow-lg">
            ${iconHtml}
          </div>
          ${driver.vehicleType ? `
            <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded px-1">
              ${driver.vehicleType.charAt(0).toUpperCase()}
            </div>
          ` : ''}
        </div>
      `
      
      // Apply rotation based on heading
      if (driver.heading !== undefined) {
        el.style.transform = `rotate(${driver.heading}deg)`
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(driver.coordinates)
        .addTo(map.current!)

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-48">
          <div class="font-semibold text-gray-900">${driver.name}</div>
          <div class="text-sm text-gray-600 capitalize">Status: ${driver.status.replace('_', ' ')}</div>
          ${driver.vehicleType ? `<div class="text-sm text-gray-600">Vehicle: ${driver.vehicleType}</div>` : ''}
          <div class="text-xs text-gray-500">Last updated: ${new Date(driver.lastUpdate).toLocaleTimeString()}</div>
        </div>
      `
      
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'driver-popup'
      }).setHTML(popupContent)
      
      marker.setPopup(popup)

      // Add click handler
      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(driver.id, driver.coordinates)
        })
      }

      driverMarkersRef.current.push(marker)
    })
  }, [driverLocations, showLiveDrivers, onMarkerClick])

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
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { MapPin, Navigation, Search, Loader2, Maximize2, Minimize2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MapLocationPickerProps {
  lat?: number | null
  lng?: number | null
  radiusMeters?: number | null
  onChange: (coords: { lat: number; lng: number; radiusMeters?: number }) => void
}

declare global {
  interface Window {
    google: any
    __googleMapsLoading?: boolean
    __googleMapsCallbacks?: (() => void)[]
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("SSR")

    if (window.google?.maps) {
      resolve()
      return
    }

    // If already loading, queue the callback
    if (window.__googleMapsLoading) {
      window.__googleMapsCallbacks = window.__googleMapsCallbacks || []
      window.__googleMapsCallbacks.push(() => resolve())
      return
    }

    window.__googleMapsLoading = true
    window.__googleMapsCallbacks = []

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      window.__googleMapsLoading = false
      window.__googleMapsCallbacks?.forEach((cb) => cb())
      window.__googleMapsCallbacks = []
      resolve()
    }
    script.onerror = () => {
      window.__googleMapsLoading = false
      reject("Failed to load Google Maps")
    }
    document.head.appendChild(script)
  })
}

export function MapLocationPicker({
  lat,
  lng,
  radiusMeters = 500,
  onChange,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)

  const [mounted, setMounted] = useState(false)
  const [currentLat, setCurrentLat] = useState<number>(lat ?? 9.0105)
  const [currentLng, setCurrentLng] = useState<number>(lng ?? 38.7612)
  const [radius, setRadius] = useState<number>(radiusMeters ?? 500)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Initialize persistent DOM container for Google Maps
  if (!mapDivRef.current && typeof window !== "undefined") {
    const div = document.createElement("div")
    div.style.width = "100%"
    div.style.height = "100%"
    div.style.minHeight = "100%"
    mapDivRef.current = div
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync external props if they change
  useEffect(() => {
    if (lat != null && lat !== currentLat) setCurrentLat(lat)
    if (lng != null && lng !== currentLng) setCurrentLng(lng)
    if (radiusMeters != null && radiusMeters !== radius) setRadius(radiusMeters)

    if (mapInstanceRef.current && markerRef.current && circleRef.current && lat != null && lng != null) {
      const pos = { lat, lng }
      markerRef.current.setPosition(pos)
      circleRef.current.setCenter(pos)
      if (radiusMeters != null) circleRef.current.setRadius(radiusMeters)
      mapInstanceRef.current.panTo(pos)
    }
  }, [lat, lng, radiusMeters])

  // Escape key exits fullscreen without bubbling to parent modal dialogs
  useEffect(() => {
    if (!fullscreen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        setFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKey, true)
    return () => window.removeEventListener("keydown", handleKey, true)
  }, [fullscreen])

  // Lock body scroll when in fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [fullscreen])

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapLoaded(true))
      .catch((err) => console.error("Google Maps load error:", err))
  }, [])

  // Initialize map instance once on persistent container
  useEffect(() => {
    if (!mapLoaded || !mapDivRef.current || !window.google?.maps) return
    if (mapInstanceRef.current) return

    const { maps } = window.google

    const map = new maps.Map(mapDivRef.current, {
      center: { lat: currentLat, lng: currentLng },
      zoom: 15,
      mapId: "afrodebab-map",
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8b8b9e" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    })

    const marker = new maps.Marker({
      map,
      position: { lat: currentLat, lng: currentLng },
      draggable: true,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#e78a53",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    })

    const circle = new maps.Circle({
      map,
      center: { lat: currentLat, lng: currentLng },
      radius: radius,
      strokeColor: "#e78a53",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#e78a53",
      fillOpacity: 0.15,
    })

    // Click on map to move pin
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const newLat = Number(e.latLng.lat().toFixed(6))
      const newLng = Number(e.latLng.lng().toFixed(6))
      marker.setPosition({ lat: newLat, lng: newLng })
      circle.setCenter({ lat: newLat, lng: newLng })
      setCurrentLat(newLat)
      setCurrentLng(newLng)
      onChange({ lat: newLat, lng: newLng, radiusMeters: radius })
    })

    // Drag pin to update
    marker.addListener("dragend", () => {
      const pos = marker.getPosition()
      if (!pos) return
      const newLat = Number(pos.lat().toFixed(6))
      const newLng = Number(pos.lng().toFixed(6))
      circle.setCenter({ lat: newLat, lng: newLng })
      setCurrentLat(newLat)
      setCurrentLng(newLng)
      onChange({ lat: newLat, lng: newLng, radiusMeters: radius })
    })

    mapInstanceRef.current = map
    markerRef.current = marker
    circleRef.current = circle
  }, [mapLoaded])

  // Attach persistent map DOM element to current rendered container & trigger resize
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !mapDivRef.current) return

    if (!mapContainerRef.current.contains(mapDivRef.current)) {
      mapContainerRef.current.replaceChildren(mapDivRef.current)
    }

    const triggerResize = () => {
      if (mapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.trigger(mapInstanceRef.current, "resize")
        // Re-center using the map's own current center to avoid stale state
        const center = mapInstanceRef.current.getCenter()
        if (center) mapInstanceRef.current.setCenter(center)
      }
    }

    // Small delay to let the DOM settle after portal mount/unmount
    const timer = setTimeout(triggerResize, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [mapLoaded, fullscreen])

  // Update radius circle dynamically
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius)
    }
  }, [radius])

  const moveMapTo = useCallback(
    (newLat: number, newLng: number, zoom?: number) => {
      const pos = { lat: newLat, lng: newLng }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(pos)
        if (zoom) mapInstanceRef.current.setZoom(zoom)
      }
      if (markerRef.current) {
        markerRef.current.setPosition(pos)
      }
      if (circleRef.current) {
        circleRef.current.setCenter(pos)
      }
      setCurrentLat(newLat)
      setCurrentLng(newLng)
      onChange({ lat: newLat, lng: newLng, radiusMeters: radius })
    },
    [onChange, radius]
  )

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const newLat = Number(pos.coords.latitude.toFixed(6))
        const newLng = Number(pos.coords.longitude.toFixed(6))
        moveMapTo(newLat, newLng, 16)
      },
      (err) => {
        setLocating(false)
        alert(`Failed to retrieve GPS location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ address: searchQuery })

      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location
        const newLat = Number(location.lat().toFixed(6))
        const newLng = Number(location.lng().toFixed(6))
        moveMapTo(newLat, newLng, 16)
      } else {
        alert("Location not found. Try searching with city or landmark name.")
      }
    } catch {
      alert("Search failed. Please try again or click on the map directly.")
    } finally {
      setSearching(false)
    }
  }

  const handleManualCoordChange = (newLatStr: string, newLngStr: string) => {
    const parsedLat = parseFloat(newLatStr)
    const parsedLng = parseFloat(newLngStr)
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      moveMapTo(parsedLat, parsedLng)
    }
  }

  const controlsContent = (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex flex-1 gap-2">
        <Input
          placeholder="Search address, landmark, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearchLocation()
            }
          }}
          className="bg-zinc-900 border-zinc-800 text-zinc-100 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          disabled={searching}
          onClick={() => handleSearchLocation()}
          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 shrink-0"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          Search
        </Button>
      </div>
      <Button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        variant="secondary"
        className="bg-[#e78a53]/20 hover:bg-[#e78a53]/30 text-[#e78a53] border border-[#e78a53]/40 shrink-0"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 mr-1" />}
        Use My GPS
      </Button>
    </div>
  )

  const coordinateInputs = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <Label className="text-xs text-zinc-400">Latitude</Label>
        <Input
          type="number"
          step="0.000001"
          value={currentLat}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            setCurrentLat(val)
            handleManualCoordChange(e.target.value, String(currentLng))
          }}
          className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 text-sm font-mono"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Longitude</Label>
        <Input
          type="number"
          step="0.000001"
          value={currentLng}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            setCurrentLng(val)
            handleManualCoordChange(String(currentLat), e.target.value)
          }}
          className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 text-sm font-mono"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Geofence Radius (meters)</Label>
        <Input
          type="number"
          min="50"
          max="5000"
          step="50"
          value={radius}
          onChange={(e) => {
            const r = parseInt(e.target.value) || 500
            setRadius(r)
            onChange({ lat: currentLat, lng: currentLng, radiusMeters: r })
          }}
          className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 text-sm"
        />
      </div>
    </div>
  )

  const handleExitFullscreen = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFullscreen(false)
  }

  // Fullscreen Overlay View rendered via React Portal to escape any parent dialog/transform container
  if (fullscreen && mounted && typeof document !== "undefined") {
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-zinc-950 p-4 sm:p-6 gap-3 text-zinc-100"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between gap-4 pb-1 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#e78a53]" />
            <div>
              <h2 className="text-base font-semibold text-white">Select Location & Geofence (Fullscreen)</h2>
              <p className="text-xs text-zinc-400">Click map or drag the pin to position your office / sub-organization</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleExitFullscreen}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white gap-1.5 shrink-0 text-sm font-medium px-4"
          >
            <Check className="h-4 w-4" />
            Done & Return
          </Button>
        </div>

        {/* Search & GPS bar */}
        <div>{controlsContent}</div>

        {/* Map Canvas taking all remaining vertical and horizontal space */}
        <div className="relative flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
          <div ref={mapContainerRef} className="w-full h-full min-h-0 z-0" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 z-10 text-zinc-300 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#e78a53]" />
              <span className="text-sm">Loading map...</span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleExitFullscreen}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 z-10 h-9 w-9 p-0 border-zinc-700 bg-zinc-950/90 backdrop-blur hover:bg-zinc-800 text-zinc-200 shadow-md"
            title="Exit fullscreen (Esc)"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-3 left-3 z-10 bg-zinc-950/90 backdrop-blur px-3 py-1.5 rounded-md border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 shadow-md">
            <MapPin className="h-3.5 w-3.5 text-[#e78a53]" />
            <span>Click map or drag pin | Radius: {radius}m</span>
          </div>
        </div>

        {/* Bottom Coordinates & Radius */}
        <div className="pt-1">{coordinateInputs}</div>
      </div>,
      document.body
    )
  }

  // Inline View
  return (
    <div className="space-y-4">
      {/* Search and GPS controls */}
      {controlsContent}

      {/* Map Display */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-md bg-zinc-900">
        <div
          ref={mapContainerRef}
          className="w-full z-0"
          style={{ height: "320px", minHeight: "320px" }}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 z-10 text-zinc-300 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#e78a53]" />
            <span className="text-sm">Loading map...</span>
          </div>
        )}
        {/* Maximize button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0 border-zinc-700 bg-zinc-950/85 backdrop-blur hover:bg-zinc-800 text-zinc-300"
          title="Fullscreen map"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-2 left-2 z-10 bg-zinc-950/85 backdrop-blur px-3 py-1.5 rounded-md border border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5 shadow">
          <MapPin className="h-3.5 w-3.5 text-[#e78a53]" />
          <span>Click anywhere on the map or drag pin to set coordinates</span>
        </div>
      </div>

      {/* Coordinate and Radius inputs */}
      {coordinateInputs}
    </div>
  )
}

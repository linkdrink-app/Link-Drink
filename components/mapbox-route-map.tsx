"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Point = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type DirectionsGeometry = {
  coordinates: [number, number][];
  type: "LineString";
};

type DirectionsResponse = {
  routes?: Array<{
    geometry: DirectionsGeometry;
    distance: number;
    duration: number;
  }>;
};

export default function MapboxRouteMap({
  points,
  cityName,
}: {
  points: Point[];
  cityName: string;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ minutes: number; km: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const fallbackCenter: [number, number] =
      cityName === "Västerås" ? [16.5465, 59.6117] : [18.0649, 59.3326];

    const firstPoint = points[0];
    const center: [number, number] = firstPoint
      ? [firstPoint.lng, firstPoint.lat]
      : fallbackCenter;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: cityName === "Västerås" ? 13 : 11.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapInstanceRef.current = map;

    map.on("load", async () => {
      const mapboxMap = mapInstanceRef.current;
      if (!mapboxMap) return;

      points.forEach((point, index) => {
        const el = document.createElement("div");
        el.className =
          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-xs font-extrabold text-slate-900 shadow";
        el.textContent = String(index + 1);

        new mapboxgl.Marker(el)
          .setLngLat([point.lng, point.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 18 }).setHTML(
              `<div style="color:#111"><strong>${point.name}</strong><br/>Stopp ${index + 1}</div>`
            )
          )
          .addTo(mapboxMap);
      });

      if (points.length < 2) return;

      try {
        const coordinates = points.map((p) => `${p.lng},${p.lat}`).join(";");
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
          `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

        const res = await fetch(url);
        const data: DirectionsResponse = await res.json();

        const route = data.routes?.[0];
        if (!route) return;

        setRouteInfo({
          minutes: Math.round(route.duration / 60),
          km: Math.round((route.distance / 1000) * 10) / 10,
        });

        mapboxMap.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          },
        });

        mapboxMap.addLayer({
          id: "route-glow",
          type: "line",
          source: "route",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#f59e0b",
            "line-width": 11,
            "line-opacity": 0.18,
          },
        });

        mapboxMap.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#f59e0b",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((coord) => {
          bounds.extend(coord);
        });
        mapboxMap.fitBounds(bounds, { padding: 48, maxZoom: 15 });
      } catch (error) {
        console.error("Directions API error:", error);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [points, cityName]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5 text-sm text-amber-100/70">
        Mapbox-token saknas i <code>.env.local</code>.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-amber-100/10 bg-[#16110f]">
      <div className="flex items-center justify-between gap-3 border-b border-amber-100/10 px-4 py-3">
        <div>
          <div className="text-sm font-bold text-amber-100">Riktig gångrutt · {cityName}</div>
          <div className="text-xs text-amber-100/55">
            {routeInfo ? `${routeInfo.km} km · cirka ${routeInfo.minutes} min till fots` : "Laddar rutt..."}
          </div>
        </div>
      </div>
      <div ref={mapRef} className="h-[360px] w-full" />
    </div>
  );
}
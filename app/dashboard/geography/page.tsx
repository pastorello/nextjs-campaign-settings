"use client";
import NonEmptyArray from "@/app/lib/definitions/types/NonEmptyArray";
import {
  MapErrorBoundary,
  MapLoadingSpinner,
} from "@/app/modules/maps/components/map";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import BaseButton from "@/app/ui/buttons/BaseButton";
import WorldMap from "@/app/ui/geography/WorldMap";
import PageTitle from "@/app/ui/typography/PageTitle";
import clsx from "clsx";
import { useState } from "react";

interface MapOption {
  name: string;
  file: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
}

const availableMaps: NonEmptyArray<MapOption> = [
  {
    name: "Piani di Esistenza",
    file: "/maps/piani-esistenza.jpg",
    bounds: [
      [0, 0],
      [1000, 1333],
    ] as L.LatLngBoundsExpression,
    initialView: [700, 655] as L.LatLngExpression,
    initialZoom: -2,
  },
  {
    name: "Mondo Materiale",
    file: "/maps/mondo-materiale.jpg",
    bounds: [
      [0, 0],
      [1000, 1142],
    ] as L.LatLngBoundsExpression,
    initialView: [500, 655] as L.LatLngExpression,
    initialZoom: 1,
  },
  {
    name: "Regno di Kang",
    file: "/maps/regno-di-kang.jpg",
    bounds: [
      [0, 0],
      [500, 1000],
    ] as L.LatLngBoundsExpression,
    initialView: [150, 540] as L.LatLngExpression,
    initialZoom: 2,
  },
  {
    name: "Città di Skreebars",
    file: "/maps/skreebars.jpg",
    bounds: [
      [0, 0],
      [1000, 1333],
    ] as L.LatLngBoundsExpression,
    initialView: [150, 540] as L.LatLngExpression,
    initialZoom: -2,
  },
];

const GeographyPage = () => {
  const [selectedMap, setSelectedMap] = useState<number>(0);

  // `availableMaps[selectedMap]` is an index read, so under
  // noUncheckedIndexedAccess it is `Map | undefined` — correctly, since
  // `selectedMap` is state and nothing constrains it to a valid index. Falling
  // back to the first map is what the page already assumed implicitly.
  const currentMap = availableMaps[selectedMap] ?? availableMaps[0];

  return (
    <div>
      <PageTitle className="mb-4">Geografia</PageTitle>
      <div className="grid gap-2 grid-cols-4 mb-4">
        {availableMaps.map((map, index) => (
          <BaseButton
            className={clsx({
              "bg-violet-700": selectedMap === index,
            })}
            key={map.name}
            onClick={() => setSelectedMap(index)}
          >
            {map.name}
          </BaseButton>
        ))}
      </div>
      <div className="relative w-full h-screen">
        <MapErrorBoundary>
          <MapProvider>
            <WorldMap
              mapUrl={currentMap.file}
              bounds={currentMap.bounds}
              initialView={currentMap.initialView}
              initialZoom={currentMap.initialZoom}
            />
            <MapLoadingSpinner />
          </MapProvider>
        </MapErrorBoundary>
      </div>
    </div>
  );
};

export default GeographyPage;

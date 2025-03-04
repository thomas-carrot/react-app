"use client";

import { useEffect, useState } from "react";
import { DirectionsRenderer } from "@react-google-maps/api";

interface RoutePlannerProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    showRoute: boolean;
    onStepsChange: (steps: google.maps.DirectionsStep[]) => void;
    onDurationChange: (duration: string) => void;
    travelMode: string;
}

const RoutePlanner = ({ origin, destination, showRoute, onStepsChange, onDurationChange, travelMode }: RoutePlannerProps) => {
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    useEffect(() => {
        if (!origin || !destination || !showRoute) return;

        new google.maps.DirectionsService().route(
            {
                origin,
                destination,
                travelMode: travelMode as google.maps.TravelMode
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result?.routes[0]?.legs[0]) {
                    setDirections(result);
                    onStepsChange(result.routes[0].legs[0].steps);
                    onDurationChange(result.routes[0].legs[0].duration!.text);
                }
            }
        );
    }, [origin, destination, showRoute, travelMode, onStepsChange, onDurationChange]);


    return directions ? <DirectionsRenderer directions={directions} /> : null;
};

export { RoutePlanner };

"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { RoutePlanner } from "@/components/RoutePlanner";

interface User {
    userId: string;
    position: google.maps.LatLngLiteral;
}

interface MapProps {
    origin: google.maps.LatLngLiteral | null;
    destination: google.maps.LatLngLiteral | null;
    showRoute: boolean;
    onStepsChange: (steps: google.maps.DirectionsStep[]) => void;
    onDurationChange: (duration: string) => void;
    travelMode: string;
    users: { [key: string]: User };
}

const Map = ({ origin, destination, showRoute, onStepsChange, onDurationChange, travelMode, users }: MapProps) => {
    console.log("users", users);
    return (
        <GoogleMap mapContainerStyle={{ width: "100%", height: "100vh" }} center={origin || { lat: 48.8566, lng: 2.3522 }} zoom={14}>
            {showRoute && origin && destination && (
                <RoutePlanner
                    origin={origin}
                    destination={destination}
                    showRoute={showRoute}
                    onStepsChange={onStepsChange}
                    onDurationChange={onDurationChange}
                    travelMode={travelMode}
                />
            )}
            {users && Object.entries(users).map(([id, user]) => {
                const position = user.position;
                return position && position.lat && position.lng ? (
                    <Marker
                        key={id}
                        position={position}
                        label={id.substring(0, 4)}
                    />
                ) : null;
            })}
        </GoogleMap>
    );
};

export { Map };

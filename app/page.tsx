"use client";

import { useState, useEffect } from "react";
import { MapProvider } from "@/providers/map-provider";
import { SearchBox } from "@/components/SearchBox";
import { Map } from "@/components/Map";
import io from "socket.io-client";

interface User {
    userId: string;
    position: google.maps.LatLngLiteral;
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080");

export default function Home() {
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
    const [showRoute, setShowRoute] = useState(false);
    const [userAddress, setUserAddress] = useState<string>("Chargement...");
    const [, setCustomOrigin] = useState<google.maps.LatLngLiteral | null>(null);
    const [steps, setSteps] = useState<google.maps.DirectionsStep[]>([]);
    const [duration, setDuration] = useState<string>("");
    const [travelMode, setTravelMode] = useState<string>("DRIVING");
    const [users, setUsers] = useState<{ [key: string]: User }>({});

    const getUserLocation = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setOrigin(userLocation);
            setCustomOrigin(null);
            fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${userLocation.lng}&lat=${userLocation.lat}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.features.length > 0) {
                        setUserAddress(data.features[0].properties.label);
                    }
                });
        });
    };
    const generateUniqueId = (): string => {
        return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    };
    const sendRouteToServer = () => {
        if (origin && destination) {
            const routeData = {
                userId: localStorage.getItem("userId"),
                origin,
                destination,
            };
            console.log(routeData);
            socket.emit("sendRoute", routeData);
        }
    };

    useEffect(() => {

        const userId = localStorage.getItem('userId') || generateUniqueId();
        localStorage.setItem('userId', userId);

        const updateUserLocation = async () => {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setOrigin(userLocation);

                socket.emit("sendPosition", {
                    userId: userId,
                    position: userLocation,
                });
            });
        };

        //const interval = setInterval(updateUserLocation, 5000);
        updateUserLocation();

        socket.on("updatePositions", (updatedUsers) => {
            setUsers(updatedUsers || {});
        });

        socket.on("receiveRoute", (routeData) => {
            console.log("Trajet reçu :", routeData);

            if (routeData.userId !== userId) {
                setOrigin(routeData.origin);
                setDestination(routeData.destination);
                setShowRoute(true);
            }
        });


        return () => {
            socket.off("receiveRoute");
            socket.off("updatePositions");
        };
    }, [showRoute]);

    return (
        <MapProvider>
            <div className="grid grid-cols-4">
                <div className="col-span-1 px-4 py-8 flex flex-col gap-3">

                    <div className="flex justify-around items-center mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="travelMode"
                                value="WALKING"
                                checked={travelMode === "WALKING"}
                                onChange={(e) => setTravelMode(e.target.value as google.maps.TravelMode)}
                                className="hidden"
                            />
                            <span className={`p-2 rounded-full transition ${travelMode === "WALKING" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-walking" viewBox="0 0 16 16"><path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6.44 3.752A.75.75 0 0 1 7 3.5h1.445c.742 0 1.32.643 1.243 1.38l-.43 4.083a1.8 1.8 0 0 1-.088.395l-.318.906.213.242a.8.8 0 0 1 .114.175l2 4.25a.75.75 0 1 1-1.357.638l-1.956-4.154-1.68-1.921A.75.75 0 0 1 6 8.96l.138-2.613-.435.489-.464 2.786a.75.75 0 1 1-1.48-.246l.5-3a.75.75 0 0 1 .18-.375l2-2.25Z"/><path d="M6.25 11.745v-1.418l1.204 1.375.261.524a.8.8 0 0 1-.12.231l-2.5 3.25a.75.75 0 1 1-1.19-.914zm4.22-4.215-.494-.494.205-1.843.006-.067 1.124 1.124h1.44a.75.75 0 0 1 0 1.5H11a.75.75 0 0 1-.531-.22Z"/></svg></span>
                            <span>Marche</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="travelMode"
                                value="DRIVING"
                                checked={travelMode === "DRIVING"}
                                onChange={(e) => setTravelMode(e.target.value as google.maps.TravelMode)}
                                className="hidden"
                            />
                            <span className={`p-2 rounded-full transition ${travelMode === "DRIVING" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-car-front-fill" viewBox="0 0 16 16"><path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848ZM3 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zM2.906 5.189a.51.51 0 0 0 .497.731c.91-.073 3.35-.17 4.597-.17s3.688.097 4.597.17a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 11.691 3H4.309a.5.5 0 0 0-.447.276L2.906 5.19Z"/></svg></span>
                            <span>Voiture</span>
                        </label>
                    </div>

                    <hr/>

                    <p className="font-bold">Départ : </p>
                    <p>{userAddress}</p>

                    <div className="flex">
                        <SearchBox onSelect={(location) => {
                            setOrigin(location);
                            setCustomOrigin(location);
                            setUserAddress("Adresse personnalisée sélectionnée");
                        }} placeholder="Adresse de départ"/>
                        <button className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500" onClick={getUserLocation}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                 className="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                                <path
                                    d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                            </svg>
                        </button>
                    </div>

                    <p className="font-bold">Destination : </p>
                    <SearchBox onSelect={(location) => setDestination(location)} placeholder="Adresse de destination"/>
                    <button className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            onClick={() => {
                                setShowRoute(true);
                                sendRouteToServer();
                            }}
                            disabled={!destination}
                    >
                        Afficher l&#39;itinéraire
                    </button>

                    <hr/>
                    {duration && <p>Temps estimé :
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 font-medium text-indigo-500 ring-1 ring-inset ring-indigo-600/20 text-xl ms-3">{duration}</span>
                    </p>}

                    {steps.length > 0 && (
                        <div className="mt-4 p-4 border rounded bg-white shadow">
                            <h2 className="text-lg font-bold mb-2">Étapes du parcours :</h2>
                            <ol className="list-decimal pl-5 space-y-2">
                                {steps.map((step, index) => (
                                    <li key={index} className="flex items-center space-x-2">
                                        <span dangerouslySetInnerHTML={{ __html: getStepIcon(step.maneuver) }} />
                                        <span className="font-bold">{step.distance!.text},</span>
                                        <span dangerouslySetInnerHTML={{ __html: step.instructions }} className="text-gray-700" />
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                <div className="col-span-3">
                    <Map
                        origin={origin}
                        destination={destination}
                        showRoute={showRoute}
                        onStepsChange={setSteps}
                        onDurationChange={setDuration}
                        travelMode={travelMode}
                        users={users}
                    />
                </div>
            </div>
        </MapProvider>
    );
}

const getStepIcon = (maneuver: string | undefined) => {
    switch (maneuver) {
        case "turn-left":
        case "fork-left":
        case "ramp-left":
        case "roundabout-left":
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"/>
                </svg>
            `;
        case "turn-right":
        case "fork-right":
        case "ramp-right":
        case "roundabout-right":
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M14.854 4.854a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 4H3.5A2.5 2.5 0 0 0 1 6.5v8a.5.5 0 0 0 1 0v-8A1.5 1.5 0 0 1 3.5 5h9.793l-3.147 3.146a.5.5 0 0 0 .708.708z"/>
                </svg>
            `;
        case "straight":
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
                </svg>
            `;
        case "uturn-left":
        case "uturn-right":
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
                </svg>
            `;
        default:
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-fill" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10"/>
                </svg>
            `;
    }
};

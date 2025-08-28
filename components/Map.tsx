import { calculateRegion } from "@/lib/map";
import { useLocationStore } from "@/store/index"; // adjust path!
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

function MapComponent() {
  console.log("🔄 Map component rendering...");
  const {
    userLatitude,
    userLongitude,
    destinationLongitude,
    destinationLatitude,
  } = useLocationStore();
  const webViewRef = useRef<WebView>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // get region FIRST
  const region = calculateRegion({
    userLongitude: userLongitude ?? null,
    userLatitude: userLatitude ?? null,
    destinationLongitude: destinationLongitude ?? null,
    destinationLatitude: destinationLatitude ?? null,
  });

  // Get user location once on mount
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      console.log(`"longitude":${longitude}, "latitude":${latitude}`);

      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      useLocationStore.getState().setUserLocation({
        latitude,
        longitude,
        address: `${address[0].name || ""}, ${address[0].region || ""}`,
      });
    };

    getLocation();
  }, []);

  // Send updated location to WebView whenever store updates
  useEffect(() => {
    if (userLatitude && userLongitude && webViewRef.current && webViewReady) {
      console.log("📍 Sending location update:", userLatitude, userLongitude);
      const message = JSON.stringify({
        type: "updateLocation",
        latitude: userLatitude,
        longitude: userLongitude,
      });

      // Add a small delay to ensure WebView is ready
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
          true; // Required for React Native WebView
        `);
      }, 100);
    }
  }, [userLatitude, userLongitude, webViewReady]);

  // Send updated destination
  useEffect(() => {
    if (
      destinationLatitude &&
      destinationLongitude &&
      webViewRef.current &&
      webViewReady
    ) {
      console.log(
        "🎯 Sending destination update:",
        destinationLatitude,
        destinationLongitude
      );
      const message = JSON.stringify({
        type: "updateDestination",
        latitude: destinationLatitude,
        longitude: destinationLongitude,
      });

      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
          true; // Required for React Native WebView
        `);
      }, 100);
    }
  }, [destinationLatitude, destinationLongitude, webViewReady]);

  // Static HTML (removed userLatitude, userLongitude from dependencies since they're not used in the HTML)
  const leafletHTML = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
            crossorigin=""/>
      <style>
        body, html { 
          margin: 0; 
          padding: 0; 
          height: 100%; 
          font-family: Arial, sans-serif;
          touch-action: none;
        }
        #map { 
          height: 100vh; 
          width: 100%;
          touch-action: none;
        }
        .custom-marker {
          background-color: #007AFF;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .leaflet-control-container {
          pointer-events: auto;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
              integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
              crossorigin=""></script>
      
      <script>
        let map;
        let userMarker;
        let destinationMarker;
        
        // Initialize map with region coordinates
        function initMap(lat, lng, zoom) {
          console.log('🗺️ Initializing map at:', lat, lng);
          map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
          }).setView([lat, lng], zoom);
          
          // Add OpenStreetMap tiles (free)
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Handle map clicks
          map.on('click', function(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              }));
            }
          });
          
          console.log('✅ Map initialized successfully');
        }
        
        // Update user location on map
        function updateUserLocation(lat, lng) {
          console.log('📍 Updating user location:', lat, lng);
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          
          // Create custom icon for user location
          const userIcon = L.divIcon({
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('You are here')
            .openPopup();
          
          // Center map on user location
          map.setView([lat, lng], 13);
          console.log('✅ User location updated');
        }
        
        // Update destination on map
        function updateDestination(lat, lng) {
          console.log('🎯 Updating destination:', lat, lng);
          if (destinationMarker) {
            map.removeLayer(destinationMarker);
          }
          
          destinationMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup('Destination')
            .openPopup();
          
          console.log('✅ Destination updated');
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          console.log('📨 Received message:', event.data);
          const data = JSON.parse(event.data);
          
          if (data.type === 'updateLocation') {
            updateUserLocation(data.latitude, data.longitude);
          } else if (data.type === 'updateDestination') {
            updateDestination(data.latitude, data.longitude);
          }
        });
        
        // Initialize map when page loads
        document.addEventListener('DOMContentLoaded', () => {
          initMap(${region.latitude}, ${region.longitude}, 13);
        });
      </script>
    </body>
    </html>
  `,
    [region.latitude, region.longitude] // Only depend on region changes
  );

  // Handle WebView ready state
  const handleWebViewLoad = () => {
    console.log("🌐 WebView loaded");
    setWebViewReady(true);
  };

  // ✅ proper return
  if (!region) {
    return (
      <View style={styles.container}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onLoad={handleWebViewLoad}
        onMessage={(event) => {
          // Handle messages from WebView (like map clicks)
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("📨 Message from WebView:", data);
          } catch (error) {
            console.log("Error parsing WebView message:", error);
          }
        }}
      />
    </View>
  );
}

export default MapComponent;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: "100%" },
});

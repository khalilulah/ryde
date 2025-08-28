import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface GoogleTextInputRef {
  hideResults: () => void;
}
const GoogleTextInput = forwardRef(
  (
    {
      icon,
      initialLocation,
      containerStyle,
      textInputBackgroundColor,
      handlePress,
    }: GoogleInputProps,
    ref: any
  ) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    useImperativeHandle(ref, () => ({
      hideResults: () => setShowResults(false),
    }));

    const searchPlaces = async (text: any) => {
      if (text.length < 3) {
        setResults([]);
        setShowResults(false);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`,
          {
            headers: {
              "User-Agent": "Ryde/1.0",
            },
          }
        );
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    };

    return (
      <View
        className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle}`}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: textInputBackgroundColor || "white",
            borderRadius: 20,
            marginHorizontal: 20,
            paddingHorizontal: 15,
          }}
        >
          <Image
            source={icon ? icon : icons.search}
            className="w-6 h-6 mr-3"
            resizeMode="contain"
          />
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              searchPlaces(text);
            }}
            placeholder={initialLocation ?? "Where do you want to go?"}
            placeholderTextColor="gray"
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: "600",
              paddingVertical: 15,
            }}
          />
        </View>

        {showResults && (
          <FlatList
            data={results}
            keyExtractor={(item: any) => item.place_id.toString()}
            style={{
              position: "absolute",
              top: 60,
              left: 20,
              right: 20,
              backgroundColor: textInputBackgroundColor || "white",
              borderRadius: 10,
              maxHeight: 300,
              zIndex: 99,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  handlePress({
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    address: item.display_name,
                  });
                  setQuery(item.display_name);
                  setShowResults(false);
                }}
                style={{
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text numberOfLines={1}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }
);

export default GoogleTextInput;

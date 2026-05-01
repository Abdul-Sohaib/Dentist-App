import { Image } from "react-native";
import { Video, ResizeMode } from "expo-av";
import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import type { MediaItem } from "@/context/AppContext";

export default function MediaPreview({ item }: { item: MediaItem }) {
  if (item.resourceType === "image") {
    return <Image source={{ uri: item.url }} style={styles.image} />;
  }

  return (
    <View style={styles.videoWrap}>
      <View style={styles.videoFrame}>
        {Platform.OS === "web" ? (
          React.createElement("video", {
            src: item.url,
            controls: true,
            playsInline: true,
            style: styles.webVideo,
          })
        ) : (
          <Video
            source={{ uri: item.url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
          />
        )}
      </View>
      <Text style={styles.caption}>Video ({Math.ceil(item.durationSeconds ?? 0)}s)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  videoWrap: {
    gap: 8,
    width: "100%",
  },
  videoFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 420,
    borderRadius: 16,
    backgroundColor: Colors.text.primary,
  },
  video: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: Colors.text.primary,
  },
  webVideo: {
    position: "relative",
    width: "100%",
    height: "auto",
    maxHeight: 420,
    display: "block",
    backgroundColor: Colors.text.primary,
  } as any,
  caption: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.text.secondary,
  },
});

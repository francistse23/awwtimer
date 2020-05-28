import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { Video } from "expo-av";
import GestureRecognizer, {
  swipeDirections,
} from "react-native-swipe-gestures";

// will prioritize prizes if there are any
// otherwise will draw from random
// viewed prizes will be deleted from local storage on close
export default function Prize({ aww, isPrize, onClose, ShareBtn }) {
  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  const handleSwipe = (gestureName) => {
    const { SWIPE_RIGHT, SWIPE_DOWN } = swipeDirections;

    switch (gestureName) {
      case SWIPE_RIGHT:
      case SWIPE_DOWN:
        onClose(isPrize, aww.id);
    }
  };

  const maybeImage = getImageUrlIfExists(aww);

  return (
    <GestureRecognizer
      config={config}
      onSwipe={(direction) => handleSwipe(direction)}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={{ fontSize: 28, textAlign: "center", paddingBottom: 15 }}>
          🎁incoming!
        </Text>

        {maybeImage && (
          <>
            <Image
              resizeMode="contain"
              source={{
                uri: maybeImage,
              }}
              style={{
                width: Dimensions.get("window").width * 0.65,
                height: Dimensions.get("window").height * 0.65,
              }}
            />

            <Text>{aww.title}</Text>
          </>
        )}

        <ShareBtn />
      </View>
    </GestureRecognizer>
  );
}

function getImageUrlIfExists(aww) {
  if (aww.url.endsWith(".jpg")) {
    return aww.url;
  }

  if (aww?.secure_media?.oembed) {
    return aww.secure_media.oembed.thumbnail_url;
  }

  return null;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
    borderRadius: 10,
    padding: 12,
    margin: 12,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffb6b6",
    flex: 1,
    paddingVertical: 60,
  },
});

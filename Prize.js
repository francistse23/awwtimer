import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GestureRecognizer, {
  swipeDirections,
} from "react-native-swipe-gestures";

// will prioritize prizes if there are any
// otherwise will draw from random
// viewed prizes will be deleted from local storage on close
export default function Prize({
  aww,
  isPrize,
  onClose,
  ShareBtn,
  NextBtn,
  videoRef,
}) {
  const [isLoading, setLoading] = React.useState(false);

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
        {isLoading && (
          <Text
            style={{ fontSize: 28, textAlign: "center", paddingBottom: 15 }}
          >
            🎁incoming!
          </Text>
        )}

        {maybeImage ? (
          <>
            <Image
              resizeMode="contain"
              source={{
                uri: maybeImage,
              }}
              style={{
                width: Dimensions.get("window").width * 0.8,
                height: Dimensions.get("window").height * 0.45,
              }}
            />
          </>
        ) : (
          <TouchableOpacity
            onPress={() => {
              videoRef.presentFullscreenPlayer();
              videoRef.playAsync();
            }}
          >
            <Image
              resizeMode="contain"
              source={{
                uri: aww.thumbnail,
              }}
              style={{
                width: Dimensions.get("window").width * 0.8,
                height: Dimensions.get("window").height * 0.45,
              }}
            />
            <Image
              resizeMode="contain"
              source={require("./assets/play.png")}
              style={{
                position: "absolute",
                left: "30%",
                top: "30%",
                width: 100,
                height: 100,
              }}
            />
          </TouchableOpacity>
        )}
        <Text style={{ padding: 12 }}>{aww.title}</Text>

        <NextBtn isPrize={isPrize} prizeId={aww.id} />
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
  overlay: {
    backgroundColor: "rgba(255,85,117,0.95)",
  },
});

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
  const videoRef = React.useRef(null);

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  const handleSwipe = (gestureName) => {
    const { SWIPE_RIGHT } = swipeDirections;

    switch (gestureName) {
      case SWIPE_RIGHT:
      case SWIPE_DOWN:
        onClose(isPrize, aww.id);
    }
  };

  if (!aww) return <Text style={{ textAlign: "center" }}>💩</Text>;
  return (
    <GestureRecognizer
      config={config}
      onSwipe={(direction) => handleSwipe(direction)}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={{ paddingHorizontal: 18, textAlign: "center" }}>
          {aww.title}
        </Text>

        {aww.url.endsWith(".jpg") && (
          <Image
            resizeMode="contain"
            source={{
              uri: aww.url,
            }}
            style={{
              width: Dimensions.get("window").width * 0.65,
              height: Dimensions.get("window").height * 0.65,
            }}
          />
        )}

        {aww?.secure_media?.oembed && (
          <Image
            resizeMode="contain"
            source={{
              uri: aww.secure_media.oembed.thumbnail_url,
            }}
            style={{
              width: Dimensions.get("window").width * 0.65,
              height: Dimensions.get("window").height * 0.65,
            }}
          />
        )}

        {!aww.url.endsWith(".jpg") && (
          <>
            <Video
              isLooping
              onLoad={() => videoRef.current.presentFullscreenPlayer()}
              ref={videoRef}
              resizeMode="contain"
              shouldPlay
              source={{
                uri:
                  aww?.crosspost_parent_list?.length > 0
                    ? aww.crosspost_parent_list[0].secure_media.reddit_video
                        .fallback_url
                    : aww.secure_media?.reddit_video?.fallback_url,
              }}
              style={{ flex: 1 }}
              useNativeControls
            />
          </>
        )}

        <ShareBtn />
      </View>
    </GestureRecognizer>
  );
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
    backgroundColor: "#ffb6b6",
    flex: 1,
    paddingVertical: 60,
  },
});

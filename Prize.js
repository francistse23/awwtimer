import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video } from "expo-av";
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
  forwardedRef,
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

  return (
    <GestureRecognizer
      config={config}
      onSwipe={(direction) => handleSwipe(direction)}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {isLoading && (
          <>
            <Text
              style={{ fontSize: 28, textAlign: "center", paddingBottom: 15 }}
            >
              🎁incoming!
            </Text>
          </>
        )}

        {!isLoading && <ShareBtn />}

        <Text style={{ paddingHorizontal: 18, textAlign: "center" }}>
          {aww.title}
        </Text>

        {(aww.url.endsWith(".jpg") ||
          aww.url.endsWith(".png") ||
          aww.url.endsWith(".gif") ||
          !aww.post_hint.includes("video")) && (
          <Image
            resizeMode="contain"
            source={{
              uri: aww.url,
            }}
            style={{
              borderRadius: 5,
              height: Dimensions.get("window").height * 0.75,
              width: Dimensions.get("window").width * 0.75,
            }}
          />
        )}

        {/* removed gif rendering using secure_media */}
        {/* not all gifs have secure_media */}

        {(aww.url.includes("gfy") ||
          aww.url.endsWith(".gifv") ||
          aww.post_hint.includes("video")) &&
          !isLoading && (
            <Video
              ref={forwardedRef}
              resizeMode="contain"
              posterSource={{ uri: aww.thumbnail }}
              posterStyle={{
                height: 300,
                width: 300,
              }}
              style={{
                alignSelf: "center",
                flex: 1,
                width: 300,
                height: 300,
              }}
              usePoster
              useNativeControls
            />
          )}
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
    justifyContent: "center",
    backgroundColor: "#ffb6b6",
    flex: 1,
    paddingVertical: 60,
  },
});

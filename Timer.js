import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import GestureRecognizer, {
  swipeDirections,
} from "react-native-swipe-gestures";

// https://reactnative.dev/docs/transforms
export const ChooseTime = ({ startTimer }) => (
  <View>
    <TouchableOpacity
      onPress={() => startTimer(5)}
      style={[
        styles.button,
        {
          transform: [{ rotate: "-3deg" }],
        },
      ]}
    >
      <Text style={styles.buttonText}>5 seconds</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => startTimer(15 * 60)}
      style={[
        styles.button,
        {
          transform: [{ rotate: "7deg" }],
        },
      ]}
    >
      <Text style={styles.buttonText}>15 minutes</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => startTimer(30 * 60)}
      style={[
        styles.button,
        {
          transform: [{ rotate: "-2deg" }],
        },
      ]}
    >
      <Text style={styles.buttonText}>30 minutes</Text>
    </TouchableOpacity>
  </View>
);

export const TimerView = ({ reset, timer }) => {
  const formatTimeRemaining = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    return `${mins >= 10 ? mins : `0${mins}`}:${
      seconds.toString().length > 1 ? seconds : `0${seconds}`
    }`;
  };

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  const handleSwipe = (gestureName) => {
    const { SWIPE_RIGHT } = swipeDirections;

    switch (gestureName) {
      case SWIPE_RIGHT:
        reset();
    }
  };

  return (
    <GestureRecognizer
      config={config}
      onSwipe={(direction) => handleSwipe(direction)}
      style={{ flex: 1 }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flex: 5,
          width: "100%",
        }}
      >
        <Text style={{ fontSize: 40 }}>{formatTimeRemaining(timer)}</Text>
      </View>
    </GestureRecognizer>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
    borderRadius: 10,
    borderColor: "white",
    borderWidth: 3,
    padding: 12,
    margin: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
});

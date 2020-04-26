import React from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Video } from "expo-av";

export default function App() {
  const [awws, setAwws] = React.useState([]);
  const [timer, setTimer] = React.useState(0);
  const [isTimerActive, setIsTimerActive] = React.useState(false);

  const videoRef = React.useRef(null);

  const calculateTimeRemaining = (time) => {
    const mins = Math.floor(time / 60);
    const seconds = time % 60;

    return `${mins >= 10 ? mins : `0${mins}`}:${
      seconds.toString().length > 1 ? seconds : `0${seconds}`
    }`;
  };

  React.useEffect(() => {
    let runTimer;

    if (isTimerActive && timer > 0) {
      runTimer = setInterval(() => {
        setTimer((timeRemaining) => timeRemaining - 1);
      }, 1);
    }

    return () => clearInterval(runTimer);
  }, [isTimerActive]);

  React.useEffect(() => {
    if (timer <= 0) {
      setIsTimerActive(false);
    }
  }, [timer]);

  React.useEffect(() => {
    async function getData() {
      const response = await fetch("https://www.reddit.com/r/aww/hot.json");
      const data = await response.json();
      const posts = data?.data?.children?.map((c) => c.data) ?? [];
      // const images = posts.filter((p) => p.url.endsWith(".jpg"));
      setAwws(posts);
    }

    getData();
  }, []);

  const randomImage = Math.floor(Math.random() * awws.length);

  // share image to friend, show when their timer is complete

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 64 }}>Timer</Text>

      <View>
        <TouchableOpacity
          onPress={() => setTimer(20 * 60)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>20 minutes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTimer(25 * 60)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>25 minutes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTimer(30 * 60)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>30 minutes</Text>
        </TouchableOpacity>
      </View>

      {timer > 0 ? (
        <View>
          <Text>{calculateTimeRemaining(timer)}</Text>
          <TouchableOpacity onPress={() => setIsTimerActive((state) => !state)}>
            <Text>{isTimerActive ? "Pause" : "Start"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        awws.length > 0 && (
          <View style={{ width: "100%" }}>
            {awws[randomImage].url.endsWith(".jpg") ? (
              <Image
                source={{
                  uri: awws[randomImage].url,
                }}
                style={{ height: 200 }}
              />
            ) : (
              <Video
                isLooping
                onLoad={() => videoRef.current.presentFullscreenPlayer()}
                ref={videoRef}
                resizeMode="contain"
                shouldPlay
                source={{
                  uri: awws[randomImage].secure_media?.reddit_video?.dash_url,
                }}
                style={{ flex: 1 }}
              />
            )}
            <Text style={{ textAlign: "center" }}>
              {awws[randomImage].title}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "blue",
    borderRadius: 10,
    color: "white",
    padding: 12,
    margin: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});

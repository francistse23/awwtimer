import React from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

export default function App() {
  const [awws, setAwws] = React.useState([]);
  const [timer, setTimer] = React.useState(0);
  const [isTimerActive, setIsTimerActive] = React.useState(false);

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
      }, 10);
    }

    return () => clearInterval(runTimer);
  }, [isTimerActive]);

  React.useEffect(() => {
    async function getData() {
      const response = await fetch("https://www.reddit.com/r/aww/hot.json");
      const data = await response.json();
      const posts = data?.data?.children?.map((c) => c.data) ?? [];
      const images = posts
        .filter((p) => p.url.endsWith(".jpg"))
        .map((i) => i.url);
      setAwws(images);
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
        <View style={{ width: "100%" }}>
          <Image source={{ uri: awws[randomImage] }} style={{ height: 200 }} />
          <Text>awwww</Text>
        </View>
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

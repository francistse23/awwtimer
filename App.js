import React from "react";
import {
  Button,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Video } from "expo-av";

export default function App() {
  const [awws, setAwws] = React.useState([]);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  // start/pause
  const [isTimerActive, setIsTimerActive] = React.useState(false);
  // timer's completion status
  const [isTimerDone, setIsTimerDone] = React.useState(false);
  const [timer, setTimer] = React.useState(0);

  const calculateTimeRemaining = (time) => {
    const mins = Math.floor(time / 60);
    const seconds = time % 60;

    return `${mins >= 10 ? mins : `0${mins}`}:${
      seconds.toString().length > 1 ? seconds : `0${seconds}`
    }`;
  };

  const setTime = (time) => {
    setTimer(time * 60);
    setIsTimerDone(false);
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
      setIsModalVisible(true);
      setIsTimerActive(false);
      setIsTimerDone(true);
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

  // share image to friend, show when their timer is complete

  return (
    <View style={styles.container}>
      <Text style={{ flex: 1, fontSize: 64 }}>Timer</Text>

      {timer > 0 ? (
        <View
          style={{
            alignItems: "center",
            flex: 5,
            width: "100%",
          }}
        >
          <Text style={{ fontSize: 40 }}>{calculateTimeRemaining(timer)}</Text>
          <TouchableOpacity onPress={() => setIsTimerActive((state) => !state)}>
            <Text style={{ fontSize: 40 }}>
              {isTimerActive ? "Pause" : "Start"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{ flex: 4, width: "100%", borderColor: "red", borderWidth: 1 }}
        >
          <TouchableOpacity onPress={() => setTime(10)} style={styles.button}>
            <Text style={styles.buttonText}>10 minutes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setTime(15)} style={styles.button}>
            <Text style={styles.buttonText}>15 minutes</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setTime(30)} style={styles.button}>
            <Text style={styles.buttonText}>30 minutes</Text>
          </TouchableOpacity>

          {isTimerDone && awws.length > 0 && (
            <MediaModal
              awws={awws}
              isModalVisible={isModalVisible}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </View>
      )}
    </View>
  );
}

const MediaModal = ({ awws, isModalVisible, onClose }) => {
  const videoRef = React.useRef(null);

  const randomImage = Math.floor(Math.random() * awws.length);

  return (
    <Modal
      statusBarTranslucent={false}
      style={{ flex: 1, width: "100%" }}
      visible={isModalVisible}
    >
      <View>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 40 }}>X</Text>
        </TouchableOpacity>
        {awws[randomImage].url.endsWith(".jpg") ? (
          <Image
            resizeMode="contain"
            source={{
              uri: awws[randomImage].url,
            }}
            style={{
              width: Dimensions.get("window").width,
              height: Dimensions.get("window").height,
            }}
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
            useNativeControls
          />
        )}
        <Text style={{ textAlign: "center" }}>{awws[randomImage].title}</Text>
      </View>
    </Modal>
  );
};

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
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    backgroundColor: "white",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
});

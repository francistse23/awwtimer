import React, { useReducer } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Video } from "expo-av";
import * as SecureStore from "expo-secure-store";
import PrizeModal from "./PrizeModal";

const ACTION_TYPES = {
  RESET: "RESET",
  START_TIME: "START_TIME",
  PAUSE_TIME: "PAUSE_TIME",
  TOGGLE_TIMER: "TOGGLE_TIMER",
  TIMER_DONE: "TIMER_DONE",
  COLLECT_PRIZE: "COLLECT_PRIZE",
};

const initialState = {
  isModalVisible: false,
  timer: 0,
  isTimerStarted: false,
  isTimerActive: false,
  isTimerDone: false,
};

const appNamespace = "awwtimer-";

function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.RESET:
      return initialState;
    case ACTION_TYPES.START_TIME:
      return {
        ...state,
        isTimerStarted: true,
        isTimerActive: true,
        timer: action.time * 60,
      };
    case ACTION_TYPES.TIMER_TICK:
      return {
        ...state,
        timer: state.timer - 1,
      };
    case ACTION_TYPES.TOGGLE_TIMER:
      return {
        ...state,
        isTimerActive: !state.isTimerActive,
      };
    case ACTION_TYPES.TIMER_DONE:
      return {
        ...state,
        isTimerActive: false,
        isTimerDone: true,
      };
    case ACTION_TYPES.COLLECT_PRIZE:
      return {
        ...state,
        isModalVisible: true,
      };

    default:
      throw new Error("get to work");
  }
}

export default function App() {
  const [timerState, dispatch] = useReducer(reducer, initialState);
  const [awws, setAwws] = React.useState([]);
  // const [prizes, setPrizes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState("");

  const {
    timer,
    isModalVisible,
    isTimerActive,
    isTimerDone,
    isTimerStarted,
  } = timerState;

  const { prizes } = currentUser;

  const randomImage = Math.floor(Math.random() * awws.length);

  React.useEffect(() => {
    let runTimer;

    if (isTimerActive && timer > 0) {
      runTimer = setInterval(
        () => dispatch({ type: ACTION_TYPES.TIMER_TICK }),
        1
      );
    }

    return () => clearInterval(runTimer);
  }, [isTimerActive]);

  // !important
  React.useEffect(() => {
    if (isTimerActive && timer <= 0) {
      dispatch({ type: ACTION_TYPES.TIMER_DONE });
    }
  }, [timer, isTimerActive]);

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
  React.useEffect(() => {
    // async function getPrizes() {
    //   try {
    //     let response = await fetch(
    //       `https://awwtimer.firebaseio.com/users/${currentUser}/prizes.json`
    //     );

    //     let prizesJson = await response.json();

    //     const prizes = Object.entries(prizesJson).flatMap(
    //       ([username, urlsObj]) => {
    //         return Object.values(urlsObj).map((u) => ({
    //           from: username,
    //           url: u,
    //         }));
    //       }
    //     );
    //     setPrizes(prizes);
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }

    async function login(username = "furanki", password = "") {
      try {
        const secureStoreOptions = {
          keychainService: Platform.OS === "ios" ? "iOS" : "Android",
        };

        const username = await SecureStore.getItemAsync(
          `${appNamespace}username`,
          secureStoreOptions
        );

        let response = await fetch(
          `https://awwtimer.firebaseio.com/users/${username}.json`
        );

        response = await response.json();

        setCurrentUser({ username, ...response });
      } catch (err) {
        throw new Error(err);
      }
    }

    if (currentUser.username) {
      // getPrizes();
    } else {
      login();
    }
  }, [currentUser]);

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 64 }}>Timer</Text>

      {/* auth route? */}
      {!currentUser ? (
        <>
          {!loading ? (
            <SignUpForm
              setLoading={setLoading}
              setCurrentUser={setCurrentUser}
            />
          ) : (
            <ActivityIndicator animating={loading} size="large" />
          )}
        </>
      ) : !isModalVisible ? (
        <>
          {prizes?.length > 0 && (
            <Text style={{ fontSize: 18 }}>
              {prizes.length} 🎁 waiting for u!
            </Text>
          )}

          {!isTimerStarted && !isTimerDone && (
            <ChooseTime dispatch={dispatch} />
          )}

          {isTimerStarted && !isTimerDone && (
            <TimerView
              isTimerActive={isTimerActive}
              dispatch={dispatch}
              timer={timer}
            />
          )}

          {isTimerDone && (
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                dispatch({
                  type: ACTION_TYPES.COLLECT_PRIZE,
                })
              }
            >
              <Text style={styles.buttonText}>Collect Your Prize :)</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={{ flex: 4, width: "100%" }}>
          {!isSharing && isTimerDone && isModalVisible && awws.length > 0 && (
            <PrizeModal
              aww={awws[randomImage]}
              friends={currentUser.friends}
              onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
              ShareBtn={() => (
                <TouchableOpacity
                  onPress={() => setIsSharing(true)}
                  style={styles.button}
                >
                  <Text style={{ color: "white", fontSize: 18 }}>
                    Share ( because you care :) )
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {isSharing && <FriendsList />}
        </View>
      )}
    </View>
  );
}

const ChooseTime = ({ dispatch }) => (
  <View style={{ flex: 5 }}>
    <TouchableOpacity
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 1 })}
      style={styles.button}
    >
      <Text style={styles.buttonText}>1 minutes</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 15 })}
      style={styles.button}
    >
      <Text style={styles.buttonText}>15 minutes</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 30 })}
      style={styles.button}
    >
      <Text style={styles.buttonText}>30 minutes</Text>
    </TouchableOpacity>
  </View>
);

const TimerView = ({ isTimerActive, dispatch, timer }) => {
  const calculateTimeRemaining = (time) => {
    const mins = Math.floor(time / 60);
    const seconds = time % 60;

    return `${mins >= 10 ? mins : `0${mins}`}:${
      seconds.toString().length > 1 ? seconds : `0${seconds}`
    }`;
  };

  return (
    <View
      style={{
        alignItems: "center",
        flex: 5,
        width: "100%",
      }}
    >
      <Text style={{ fontSize: 40 }}>{calculateTimeRemaining(timer)}</Text>
      <TouchableOpacity
        onPress={() => dispatch({ type: ACTION_TYPES.TOGGLE_TIMER })}
      >
        <Text style={{ fontSize: 40 }}>
          {isTimerActive ? "Pause" : "Start"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "royalblue",
    borderRadius: 10,
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
    paddingVertical: 12,
  },
  input: {
    borderColor: "black",
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    padding: 8,
    width: "60%",
  },
});

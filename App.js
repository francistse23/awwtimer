import React, { useState, useReducer } from "react";
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
import SignUpForm from "./SignUpForm";
import PrizeModal from "./PrizeModal";
import FriendsList from "./FriendsList";

const ACTION_TYPES = {
  RESET: "RESET",
  START_TIME: "START_TIME",
  PAUSE_TIME: "PAUSE_TIME",
  TOGGLE_TIMER: "TOGGLE_TIMER",
  TIMER_DONE: "TIMER_DONE",
  COLLECT_PRIZE: "COLLECT_PRIZE",
  SHARE_PRIZE: "SHARE_PRIZE",
  CREATE_USER: "CREATE_USER",
};

const initialState = {
  isModalVisible: false,
  timer: 0,
  isTimerStarted: false,
  isTimerActive: false,
  isTimerDone: false,
  isSharing: false,
  isCreatingUser: false,
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
    case ACTION_TYPES.SHARE_PRIZE:
      return {
        ...state,
        isSharing: true,
        isModalVisible: false,
      };
    case ACTION_TYPES.CREATE_USER:
      return {
        ...initialState,
        isCreatingUser: true,
      };
    default:
      throw new Error("get to work");
  }
}

export default function App() {
  const [timerState, dispatch] = useReducer(reducer, initialState);
  const [currentUser, setCurrentUser] = useState(null);

  const [aww, setAww] = React.useState(null);

  async function login(username = "", password = "") {
    try {
      const secureStoreOptions = {
        keychainService: Platform.OS === "ios" ? "iOS" : "Android",
      };

      // should return username#code
      let user = await SecureStore.getItemAsync(
        `${appNamespace}username`,
        secureStoreOptions
      );

      // if (!username) {
      //   let response = await fetch(
      //     `https://awwtimer.firebaseio.com/users/${username}.json`
      //   );
      //   response = await response.json();
      //   // user =
      // }

      setCurrentUser(user);
    } catch (err) {
      throw new Error(err);
    }
  }

  React.useEffect(() => {
    async function getData() {
      const response = await fetch("https://www.reddit.com/r/aww/hot.json");
      const data = await response.json();
      const posts = data?.data?.children?.map((c) => c.data) ?? [];

      const randomIndex = Math.floor(Math.random() * posts.length);
      const aww = posts[3];
      // const images = posts.filter((p) => p.url.endsWith(".jpg"));

      setAww(aww);
    }

    getData();
  }, []);

  const {
    timer,
    isModalVisible,
    isTimerActive,
    isTimerDone,
    isTimerStarted,
    isSharing,
    isCreatingUser,
  } = timerState;

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
    login();
  }, []);

  if (isCreatingUser) {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 12 }}>Create a user</Text>
        <SignUpForm
          onUserCreated={(username) => {
            setCurrentUser(username);
            dispatch({ type: ACTION_TYPES.RESET });
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 36, paddingHorizontal: 12 }}>
        {`( ∩ˇωˇ∩)♡\nかわいい\nタイマー`}
      </Text>
      <>
        {!isTimerStarted && !isTimerDone && (
          <>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ChooseTime dispatch={dispatch} />
            </View>

            {!currentUser && (
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  dispatch({
                    type: ACTION_TYPES.CREATE_USER,
                  })
                }
              >
                <Text style={styles.buttonText}>Create a user to share</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isTimerStarted && !isTimerDone && (
          <TimerView
            isTimerActive={isTimerActive}
            dispatch={dispatch}
            timer={timer}
          />
        )}

        {isTimerDone && !isSharing && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              dispatch({
                type: ACTION_TYPES.COLLECT_PRIZE,
              })
            }
          >
            <Text style={styles.buttonText}>Open 🎁 :)</Text>
          </TouchableOpacity>
        )}

        {isSharing && (
          <FriendsList
            onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
            currentUser={currentUser}
          />
        )}
        {currentUser && !isTimerStarted && (
          <Text
            style={styles.altText}
          >{`connect with friends as ${currentUser}`}</Text>
        )}
      </>
      {isModalVisible && (
        <View style={{ flex: 4, width: "100%" }}>
          {isTimerDone && isModalVisible && (
            <PrizeModal
              aww={aww}
              onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
              ShareBtn={() => (
                <TouchableOpacity
                  onPress={() => dispatch({ type: ACTION_TYPES.SHARE_PRIZE })}
                  style={styles.button}
                >
                  <Text style={{ color: "white", fontSize: 18 }}>
                    Share ( because you care :) )
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

// https://reactnative.dev/docs/transforms
const ChooseTime = ({ dispatch }) => (
  <View>
    <TouchableOpacity
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 1 })}
      style={[
        styles.button,
        {
          transform: [{ rotate: "-3deg" }],
        },
      ]}
    >
      <Text style={styles.buttonText}>1 minutes</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 15 })}
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
      onPress={() => dispatch({ type: ACTION_TYPES.START_TIME, time: 30 })}
      style={[
        styles.button,
        {
          transform: [{ rotate: "-9deg" }],
        },
      ]}
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
        justifyContent: "center",
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
    backgroundColor: "#679b9b",
    borderRadius: 10,
    borderColor: "white",
    borderWidth: 3,
    padding: 12,
    margin: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#ffb6b6",
    flex: 1,
    paddingVertical: 48,
  },
  input: {
    borderColor: "black",
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    padding: 8,
    width: "60%",
  },
  altText: {
    color: "#333",
    fontWeight: "300",
  },
});

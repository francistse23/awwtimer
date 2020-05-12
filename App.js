import React, { useState, useReducer } from "react";
import {
  AsyncStorage,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GestureRecognizer, {
  swipeDirections,
} from "react-native-swipe-gestures";
import * as SecureStore from "expo-secure-store";
import SignUpForm from "./SignUpForm";
import PrizeModal from "./PrizeModal";
import FriendsList from "./FriendsList";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";

const ACTION_TYPES = {
  RESET: "RESET",
  START_TIME: "START_TIME",
  TIMER_TICK: "TIMER_TICK",
  TIMER_DONE: "TIMER_DONE",
  COLLECT_PRIZE: "COLLECT_PRIZE",
  SHARE_PRIZE: "SHARE_PRIZE",
  CREATE_USER: "CREATE_USER",
};

const initialState = {
  isModalVisible: false,
  timer: 0,
  isTimerStarted: false,
  isTimerDone: false,
  isSharing: false,
  isCreatingUser: false,
  timerEndDate: null,
};

const appNamespace = "awwtimer-";

function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.RESET:
      return initialState;
    case ACTION_TYPES.START_TIME:
      console.log("starting timer");
      /*
       * need to handle two cases.
       * 1. User leaves the app open
       * 2. User starts timer and locks screen
       */

      const timerEndDate =
        new Date().getTime() + action.durationInSeconds * 1000;

      /*
       * Handle case 2 with local notifications. When system clock reaches
       * timerEndDate, a notification will prompt the user to open the app to
       * collect the prize.
       */
      const localNotification = {
        title: "Aww Timer",
        body: "Good job! Open your reward and take a break!",
        data: { isTimerDone: true },
      };

      const schedulingOptions = {
        time: timerEndDate,
      };

      // clear all existing notifications before we schedule one
      Notifications.cancelAllScheduledNotificationsAsync();

      Notifications.scheduleLocalNotificationAsync(
        localNotification,
        schedulingOptions
      )
        .then(() => console.log("schedule notification"))
        .catch((err) => console.error(err));

      /*
       * Handle case 1 by setting timerEndDate in local state. The view will
       * show the difference between the end date and system time.
       */
      return {
        ...state,
        isTimerStarted: true,
        timer: Math.ceil((timerEndDate - new Date().getTime()) / 1000),
        timerEndDate,
      };
    case ACTION_TYPES.TIMER_TICK:
      return {
        ...state,
        timer: Math.ceil((state.timerEndDate - new Date().getTime()) / 1000),
      };
    case ACTION_TYPES.TIMER_DONE:
      return {
        ...state,
        isTimerDone: true,
        timerEndDate: null,
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
  const [prizes, setPrizes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [aww, setAww] = React.useState(null);

  const {
    timer,
    timerEndDate,
    isModalVisible,
    isTimerDone,
    isTimerStarted,
    isSharing,
    isCreatingUser,
  } = timerState;

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  const handleSwipe = (gestureName) => {
    const { SWIPE_RIGHT } = swipeDirections;

    switch (gestureName) {
      case SWIPE_RIGHT:
        dispatch({ type: ACTION_TYPES.RESET });
    }
  };

  // https://reactnative.dev/docs/asyncstorage.html
  // supposed to be deprecated
  // but expo has issues with the independent package
  async function getPrizes(user) {
    try {
      // await AsyncStorage.removeItem(`${appNamespace}prizes`);

      // prizes from local storage
      let prizesInStorage = JSON.parse(
        await AsyncStorage.getItem(`${appNamespace}prizes`)
      );

      console.log("prizes in storage", prizesInStorage);

      // prizes from database
      let response = await fetch(
        `https://awwtimer.firebaseio.com/prizes/${user.split("#")[0]}.json`
      );

      let prizesJson = await response.json();

      console.log("prizes from db", prizesJson);

      if (prizesInStorage || prizesJson) {
        const data =
          prizesInStorage && prizesJson
            ? { ...prizesInStorage, ...prizesJson }
            : prizesInStorage && !prizesJson
            ? prizesInStorage
            : prizesJson;

        await AsyncStorage.setItem(
          `${appNamespace}prizes`,
          JSON.stringify(data)
        );

        setPrizes(data);

        // delete prizes from database since it's now transferred to local storage
        await fetch(
          `https://awwtimer.firebaseio.com/prizes/${user.split("#")[0]}.json`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            method: "delete",
            mode: "cors",
          }
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function login() {
    try {
      const secureStoreOptions = {
        keychainService: Platform.OS === "ios" ? "iOS" : "Android",
      };

      // should return username#code
      let user = await SecureStore.getItemAsync(
        `${appNamespace}username`,
        secureStoreOptions
      );

      setCurrentUser(user);

      getPrizes(user);
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
      const aww = posts[1];
      // const images = posts.filter((p) => p.url.endsWith(".jpg"));

      setAww(aww);
    }

    getData();
  }, []);

  React.useEffect(() => {
    askForNotificationPermissions();
  }, []);

  // get the system time every second so we can display the difference
  // between it and the timerEndDate
  React.useEffect(() => {
    let runTimer;

    if (timerEndDate) {
      runTimer = setInterval(() => {
        const now = new Date().getTime();
        const timeRemaining = Math.ceil((timerEndDate - now) / 1000);
        if (timeRemaining < 0) {
          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        } else {
          dispatch({ type: ACTION_TYPES.TIMER_TICK });
        }
      }, 1000);
    }

    return () => clearInterval(runTimer);
  }, [timerEndDate]);

  React.useEffect(() => {
    login();
    const unsubscribeFromNotifications = Notifications.addListener(
      (notification) => {
        console.log("Notification received:", notification);
        if (notification?.data?.isTimerDone) {
          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        }
      }
    );

    return () => unsubscribeFromNotifications.remove();
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
    <GestureRecognizer
      config={config}
      onSwipe={(direction) => handleSwipe(direction)}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={{ fontSize: 36, paddingHorizontal: 12 }}>
          {`( ∩ˇωˇ∩)♡\nかわいい\nタイマー`}
        </Text>
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                getPrizes(currentUser.split("#")[0]);
                setRefreshing(false);
              }}
            />
          }
        >
          {Object.keys(prizes).length > 0 && (
            <Text>{Object.keys(prizes).length} prizes waiting for you!</Text>
          )}

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
            <TimerView dispatch={dispatch} timer={timer} />
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
              <Text style={styles.buttonText}>
                🎁 <Text style={{ fontWeight: "300" }}>ʕ•ᴥ•ʔ</Text>
              </Text>
            </TouchableOpacity>
          )}

          {isSharing && (
            <FriendsList
              aww={
                Object.keys(prizes).length > 0
                  ? prizes[Object.keys(prizes)[0]]
                  : aww
              }
              isPrize={Object.keys(prizes).length > 0 ? true : false}
              onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
              currentUser={currentUser}
            />
          )}
          {currentUser && !isTimerStarted && (
            <Text
              style={styles.altText}
            >{`connect with friends as ${currentUser}`}</Text>
          )}
        </ScrollView>
        {isModalVisible && (
          <View style={{ flex: 4, width: "100%" }}>
            {isTimerDone && isModalVisible && (
              <PrizeModal
                aww={
                  Object.keys(prizes).length > 0
                    ? prizes[Object.keys(prizes)[0]]
                    : aww
                }
                isPrize={Object.keys(prizes).length > 0 ? true : false}
                onClose={async (isPrize, prizeId) => {
                  if (isPrize) {
                    delete prizes[prizeId];
                    if (Object.keys(prizes).length > 0) {
                      await AsyncStorage.setItem(
                        `${appNamespace}prizes`,
                        JSON.stringify(prizes)
                      );
                    } else {
                      await AsyncStorage.removeItem(`${appNamespace}prizes`);
                    }
                  }
                  dispatch({ type: ACTION_TYPES.RESET });
                }}
                ShareBtn={() => (
                  <TouchableOpacity
                    onPress={() => dispatch({ type: ACTION_TYPES.SHARE_PRIZE })}
                    style={styles.button}
                  >
                    <Text style={{ color: "white", fontSize: 18 }}>
                      Share ( because you care ʕ๑•ᴥ•ʔ )
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </GestureRecognizer>
  );
}

// https://reactnative.dev/docs/transforms
const ChooseTime = ({ dispatch }) => (
  <View>
    <TouchableOpacity
      onPress={() =>
        dispatch({ type: ACTION_TYPES.START_TIME, durationInSeconds: 5 })
      }
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
      onPress={() =>
        dispatch({ type: ACTION_TYPES.START_TIME, durationInSeconds: 15 * 60 })
      }
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
      onPress={() =>
        dispatch({ type: ACTION_TYPES.START_TIME, durationInSeconds: 30 * 60 })
      }
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

const TimerView = ({ timer }) => {
  const formatTimeRemaining = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

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
      <Text style={{ fontSize: 40 }}>{formatTimeRemaining(timer)}</Text>
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

// taken from https://snack.expo.io/?platform=android&name=Push%20Notifications&sdkVersion=37.0.0&dependencies=expo-constants%2Cexpo-permissions&sourceUrl=https%3A%2F%2Fdocs.expo.io%2Fstatic%2Fexamples%2Fv37.0.0%2Fpushnotifications.js
// https://docs.expo.io/versions/v37.0.0/sdk/permissions/
async function askForNotificationPermissions() {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.USER_FACING_NOTIFICATIONS
  );
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Permissions.askAsync(
      Permissions.USER_FACING_NOTIFICATIONS
    );
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Failed to get permissions for notifications");
    return;
  }

  if (Platform.OS === "android") {
    Notifications.createChannelAndroidAsync("default", {
      name: "default",
      sound: true,
      priority: "max",
      vibrate: [0, 250, 250, 250],
    });
  }
}

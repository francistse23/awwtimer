import React, { useState, useReducer } from "react";
import {
  AsyncStorage,
  Button,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViewPager from "@react-native-community/viewpager";
import * as SecureStore from "expo-secure-store";
import SignUpForm from "./SignUpForm";
import PrizeModal from "./Prize";
import FriendsList from "./FriendsList";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import { TimerView, ChooseTime } from "./Timer";

export const ACTION_TYPES = {
  RESET: "RESET",
  START_TIME: "START_TIME",
  TIMER_TICK: "TIMER_TICK",
  TIMER_DONE: "TIMER_DONE",
  COLLECT_PRIZE: "COLLECT_PRIZE",
  SHARE_PRIZE: "SHARE_PRIZE",
  CREATE_USER: "CREATE_USER",
};

const initialState = {
  isPrizeVisible: false,
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
      scheduleLocalNotification(timerEndDate);

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
        isPrizeVisible: true,
      };
    case ACTION_TYPES.SHARE_PRIZE:
      return {
        ...state,
        isSharing: true,
        isPrizeVisible: false,
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
  const [friends, setFriends] = React.useState([]);
  const [prizes, setPrizes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [aww, setAww] = React.useState(null);
  const [error, setError] = React.useState(null);

  const {
    timer,
    timerEndDate,
    isPrizeVisible,
    isTimerDone,
    isTimerStarted,
    isSharing,
    isCreatingUser,
  } = timerState;

  async function getFriends(currentUser) {
    try {
      setError(null);
      console.log(`finding friends for ${currentUser}`);

      // currentUser will log the username with #xxxx
      // split to get the username only
      let response = await fetch(
        `https://awwtimer.firebaseio.com/friends/${
          currentUser?.split("#")[0]
        }.json`
      );

      let responseJson = await response.json();

      const friends = Object.entries(responseJson).map(
        ([username, isFriend]) => {
          if (isFriend) return username;
        }
      );

      setFriends(friends);
    } catch (error) {
      setError("could not get friends", error);
    }
  }

  // https://reactnative.dev/docs/asyncstorage.html
  // supposed to be deprecated
  // but expo has issues with the independent package
  async function getPrizes(user) {
    try {
      if (user) {
        // await AsyncStorage.removeItem(`${appNamespace}prizes`);

        // prizes from local storage
        let prizesInStorage = JSON.parse(
          await AsyncStorage.getItem(`${appNamespace}prizes`)
        );

        // console.log("prizes in storage", prizesInStorage);

        // prizes from database
        let response = await fetch(
          `https://awwtimer.firebaseio.com/prizes/${user.split("#")[0]}.json`
        );

        let prizesJson = await response.json();

        // console.log("prizes from db", prizesJson);

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

      if (user) {
        setCurrentUser(user);
        getFriends(user);
        getPrizes(user);
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async function getData() {
    const response = await fetch("https://www.reddit.com/r/aww/hot.json");
    const data = await response.json();
    const posts = data?.data?.children?.map((c) => c.data) ?? [];

    const randomIndex = Math.floor(Math.random() * posts.length);
    const aww = posts[randomIndex];
    // const images = posts.filter((p) => p.url.endsWith(".jpg"));

    setAww(aww);
  }

  React.useEffect(() => {
    const unsubscribeFromNotifications = Notifications.addListener(
      (notification) => {
        console.log("Notification received:", notification);
        if (notification?.data?.isTimerDone) {
          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        }
      }
    );

    login();
    askForNotificationPermissions();

    return () => unsubscribeFromNotifications.remove();
  }, []);

  // get the system time every second so we can display the difference
  // between it and the timerEndDate
  React.useEffect(() => {
    let runTimer;

    getData();

    if (timerEndDate) {
      runTimer = setInterval(() => {
        const now = new Date().getTime();
        const timeRemaining = Math.ceil((timerEndDate - now) / 1000);
        if (timeRemaining < 0) {
          if (currentUser) {
            getPrizes(currentUser.split("#")[0]);
          }

          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        } else {
          dispatch({ type: ACTION_TYPES.TIMER_TICK });
        }
      }, 1000);
    }

    return () => clearInterval(runTimer);
  }, [timerEndDate]);

  if (isCreatingUser) {
    return (
      <View style={styles.signUpContainer}>
        <Text style={{ fontSize: 36 }}>Create a user 🤗</Text>
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
    <>
      {/* Prize */}
      {isPrizeVisible ? (
        isTimerDone && (
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
            // route user to sign up if they aren't logged in?
            // is now routing user to sign up
            // but how can we handle after the sign up since it takes them
            // back to the choose time view?
            ShareBtn={() =>
              currentUser ? (
                <TouchableOpacity
                  onPress={() => dispatch({ type: ACTION_TYPES.SHARE_PRIZE })}
                  style={styles.button}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      textAlign: "center",
                    }}
                  >
                    {`Share\n( because you care ʕ๑•ᴥ•ʔ )`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => dispatch({ type: ACTION_TYPES.RESET })}
                  style={styles.button}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      textAlign: "center",
                    }}
                  >
                    Good job!
                  </Text>
                </TouchableOpacity>
              )
            }
          />
        )
      ) : (
        <ViewPager initialPage={0} style={styles.container}>
          {/* View pager provides the swiping/carousel like function */}
          {/* https://github.com/react-native-community/react-native-viewpager */}
          <ScrollView
            contentContainerStyle={styles.viewContainer}
            key="main"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  getPrizes(currentUser?.split("#")[0]);
                  setRefreshing(false);
                }}
              />
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 36, paddingHorizontal: 12 }}>
                {`( ∩ˇωˇ∩)♡\nかわいい\nタイマー`}
              </Text>
              {Object.keys(prizes).length > 0 && (
                <Text>
                  {Object.keys(prizes).length} prizes waiting for you!
                </Text>
              )}
            </View>

            <View
              style={{
                alignItems: "center",
                flex: 2,
              }}
            >
              {!isTimerStarted && !isTimerDone && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ChooseTime
                    startTimer={(time) =>
                      dispatch({
                        type: ACTION_TYPES.START_TIME,
                        durationInSeconds: time,
                      })
                    }
                  />
                  {/* creates/resets user */}
                  {currentUser ? (
                    <Button
                      onPress={() => {
                        console.log("deleting user");
                        const secureStoreOptions = {
                          keychainService:
                            Platform.OS === "ios" ? "iOS" : "Android",
                        };

                        SecureStore.deleteItemAsync(
                          `${appNamespace}username`,
                          secureStoreOptions
                        );
                      }}
                      title="Reset user"
                    />
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          transform: [{ rotate: "5deg" }],
                        },
                      ]}
                      onPress={() =>
                        dispatch({
                          type: ACTION_TYPES.CREATE_USER,
                        })
                      }
                    >
                      <Text style={styles.buttonText}>
                        Create a user to share
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isTimerStarted && !isTimerDone && (
                <TimerView
                  reset={() => dispatch({ type: ACTION_TYPES.RESET })}
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
                  error={error}
                  friends={friends}
                  onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
                />
              )}
            </View>
          </ScrollView>
          {!isTimerStarted && currentUser && (
            // have to wrap in view
            // otherwise viewpager doesnt render correctly
            <View key="friends" style={{ flex: 1, paddingVertical: 60 }}>
              <FriendsList
                currentUser={currentUser}
                error={error}
                friends={friends}
                getFriends={() => getFriends(currentUser?.split("#")[0])}
                isViewing={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      getFriends(currentUser?.split("#")[0]);
                      setRefreshing(false);
                    }}
                  />
                }
              />
            </View>
          )}
        </ViewPager>
      )}
    </>
  );
}

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
    paddingVertical: 60,
  },
  input: {
    borderColor: "black",
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    padding: 8,
    width: "60%",
  },
  signUpContainer: {
    alignItems: "center",
    backgroundColor: "#ffb6b6",
    flex: 1,
    paddingVertical: 100,
  },
  viewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
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

function scheduleLocalNotification(timerEndDate) {
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
}

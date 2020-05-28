<<<<<<< HEAD
import React, { useState, useReducer, useRef } from "react";
import {
  AsyncStorage,
  Button,
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
import { Video } from "expo-av";
import SignUpForm from "./SignUpForm";
import Prize from "./Prize";
import FriendsList from "./FriendsList";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import { TimerView, ChooseTime } from "./Timer";
=======
import React from "react";
import { Video } from "expo-av";
>>>>>>> d36dd788a73cbcceb24060ebccc989d44ad03fc5

import App2 from "./App2";

export default function App() {
<<<<<<< HEAD
  const [timerState, dispatch] = useReducer(reducer, initialState);
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = React.useState([]);
  const [prizes, setPrizes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [after, setAfter] = useState(null);
  const [aww, setAww] = React.useState(null);
  const [error, setError] = React.useState(null);

  const { timer, timerEndDate, currentViewState } = timerState;

  /*
   * The componentDidMount logic. This runs only on app init b/c of the [] as a dependency
   */
  React.useEffect(() => {
    const unsubscribeFromNotifications = Notifications.addListener(
      (notification) => {
        // console.log("Notification received:", notification);
        if (notification?.data?.isTimerDone) {
          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        }
      }
    );

    // start getting stuff
    getStoredUserInfo().then((user) => {
      if (!user) return;

      setCurrentUser(user);
      getFriends(user)
        .then((friends) => setFriends(friends))
        .catch((error) => setError(error));
      getPrizes(user).then((prizes) => setPrizes(prizes));
    });

    askForNotificationPermissions();

    return () => unsubscribeFromNotifications.remove();
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
          if (currentUser) {
            getPrizes(currentUser).then((prizes) => setPrizes(prizes));
          }

          dispatch({ type: ACTION_TYPES.TIMER_DONE });
        } else {
          dispatch({ type: ACTION_TYPES.TIMER_TICK });
        }
      }, 1000);
    }

    return () => clearInterval(runTimer);
  }, [timerEndDate]);

  if (currentViewState === VIEW_STATES.VIEWING_PRIZE) {
    return (
      <Prize
        aww={
          Object.keys(prizes).length > 0 ? prizes[Object.keys(prizes)[0]] : aww
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
    );
  }

  if (currentViewState === VIEW_STATES.TIMER_RUNNING) {
    return (
      <View style={styles.container}>
        <TimerView
          reset={() => dispatch({ type: ACTION_TYPES.RESET })}
          timer={timer}
        />
      </View>
    );
  }

  if (currentViewState === VIEW_STATES.TIMER_DONE) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  if (currentViewState === VIEW_STATES.SHARING_PRIZE) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

=======
  const [videoRef, setVideoRef] = React.useState(null);
>>>>>>> d36dd788a73cbcceb24060ebccc989d44ad03fc5
  return (
    <>
      <Video
        isLooping
        ref={(theRef) => setVideoRef(theRef)}
        resizeMode="contain"
        style={{ flex: 1, display: "none" }}
        useNativeControls
      />
      <App2 videoRef={videoRef} />
    </>
  );
}

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

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
          {isTimerDone && isModalVisible && awws.length > 0 && (
            <PrizeModal
              aww={awws[randomImage]}
              friends={currentUser.friends}
              onClose={() => dispatch({ type: ACTION_TYPES.RESET })}
            />
          )}
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

const SignUpForm = ({ setLoading, setCurrentUser }) => {
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");

  const createUser = async () => {
    try {
      const data = {
        [username]: {
          id: uuidv4(),
          friends:
            // auto adding each other as friends, because... why not?
            // also auto adding us as friends to all new users
            // we want to see some of those aww posts too
            username === "furanki"
              ? [{ arcsecond: "a2941f0a-9cd0-4bb9-8532-df3b49981a82" }]
              : username === "arcsecond"
              ? [{ furanki: "9d8f6d67-2b50-4b09-8234-38ed0ca8e2e2" }]
              : [
                  { arcsecond: "a2941f0a-9cd0-4bb9-8532-df3b49981a82" },
                  { furanki: "9d8f6d67-2b50-4b09-8234-38ed0ca8e2e2" },
                ],
          prizes: [0],
        },
      };

      let res = await fetch("https://awwtimer.firebaseio.com/users.json", {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        // dont use post or put
        // post, firebase will auto-generate a key/id and use that as the new user object's key, too chaotic
        // put, replaces all users (effectively wiping all users)
        method: "patch",
        mode: "cors",
      });

      res = await res.json();

      storeCredentials(username, password);
      setCurrentUser({ username, ...res });
      setLoading(false);
    } catch (err) {
      throw new Error(err);
    }
  };

  // stores user credentials to the platform's secure keychain
  const storeCredentials = async (username, password) => {
    const secureStoreOptions = {
      keychainService: Platform.OS === "ios" ? "iOS" : "Android",
    };
    await SecureStore.setItemAsync(
      `${appNamespace}username`,
      username,
      secureStoreOptions
    );
    await SecureStore.setItemAsync(
      `${appNamespace}password`,
      password,
      secureStoreOptions
    );
  };

  return (
    <>
      <TextInput
        onChangeText={(text) => setUsername(text)}
        placeholder="username"
        style={styles.input}
        value={username}
      />
      <TextInput
        onChangeText={(text) => setPassword(text)}
        placeholder="password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setLoading(true);
          createUser();
        }}
      >
        <Text style={styles.buttonText}>Create User :)</Text>
      </TouchableOpacity>
    </>
  );
};

const FriendsList = ({
  friends,
  selectedFriends,
  setSelectedFriends,
  shareToFriends,
}) => {
  const addFriend = (friend) => {
    if (selectedFriends.includes(friend)) {
      let temp = [...selectedFriends];
      temp.splice(selectedFriends.indexOf(friend), 1);

      setSelectedFriends(temp);
    } else {
      setSelectedFriends((selectedFriends) => [...selectedFriends, friend]);
    }
  };

  console.log(friends);

  return (
    <>
      <Text>Your friends 😀</Text>
      <View style={{ flexDirection: "row" }}>
        <FlatList
          data={friends}
          horizontal
          keyExtractor={(item) => Object.keys(item)[0]}
          renderItem={({ item }) => {
            const [friendName] = Object.keys(item);

            return (
              <TouchableOpacity
                onPress={() => addFriend(friendName)}
                style={
                  selectedFriends.includes(friendName)
                    ? styles.button
                    : { ...styles.button, backgroundColor: "lightgray" }
                }
              >
                <Text style={styles.buttonText}>{friendName}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity
          disabled={selectedFriends.length < 1}
          onPress={() => shareToFriends()}
          style={
            selectedFriends.length < 1
              ? { ...styles.button, backgroundColor: "lightgray" }
              : styles.button
          }
        >
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </>
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

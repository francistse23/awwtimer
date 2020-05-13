import React from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";

export default function FriendsList({
  aww = {},
  currentUser,
  error,
  friends,
  isViewing = false,
  onClose,
  refreshControl,
}) {
  const [friendName, setFriendName] = React.useState("");
  const [selectedFriends, setSelectedFriends] = React.useState([]);
  const [addError, setAddError] = React.useState(null);

  const addFriend = async (friendName) => {
    try {
      const [name, code] = friendName.split("#");

      const friendCode = await fetch(
        `https://awwtimer.firebaseio.com/users/${name}.json`
      );

      if (friendCode === code) {
        const data = { [name]: true };

        await fetch(
          `https://awwtimer.firebaseio.com/friends/${currentUser}.json`,
          {
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
            },
            method: "patch",
            mode: "cors",
          }
        );
      } else {
        // throw error, mismatch code
      }
    } catch (e) {
      throw new Error(e);
    }
  };

  const addFriendToShare = (friend) => {
    if (selectedFriends.includes(friend)) {
      let temp = [...selectedFriends];
      temp.splice(selectedFriends.indexOf(friend), 1);

      setSelectedFriends(temp);
    } else {
      setSelectedFriends((selectedFriends) => [...selectedFriends, friend]);
    }
  };

  const shareToFriends = async () => {
    try {
      for (let friend of selectedFriends) {
        // to maintain the structure (lessen the work on the prize modal render)
        // passing in the entire media object to store in database
        // we can revisit if this consumes too much data
        // should we keep track of who sent the prize?
        const data = {
          [aww.id]: aww,
        };

        // check for mismatch username too

        await fetch(`https://awwtimer.firebaseio.com/prizes/${friend}.json`, {
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
          method: "patch",
          mode: "cors",
        });

        // alert the user share went through
        // auto redirect to home by dismissing modal
        Alert.alert("Share successful!", "Your friends will go awwwwww", [
          { text: "Close", onPress: onClose },
        ]);
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View style={styles.horizontalContainer}>
        <Text style={{ fontSize: 24, textAlign: "center" }}>
          Your friends 😀
        </Text>
      </View>

      <TextInput
        onChangeText={(text) => setFriendName(text)}
        placeholder="e.g. arcsecond#7125"
        style={styles.input}
        value={friendName}
      />

      <TouchableOpacity
        disabled={!friendName && friendName.split("#").length < 2}
        style={{ ...styles.button, flex: 1 }}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>

      <FlatList
        contentContainerStyle={{
          alignItems: "center",
          flex: 1,
          justifyContent: "space-around",
          paddingVertical: isViewing ? 48 : 16,
          width: Dimensions.get("window").width,
        }}
        data={friends}
        keyExtractor={(item) => item}
        ListEmptyComponent={() => (
          <Text>
            {error && "Sry, we suck and can't find your friends"}
            {!error && "find some friends"}
          </Text>
        )}
        ListFooterComponent={() =>
          !isViewing && (
            <View style={styles.buttonContainer}>
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
              <TouchableOpacity
                onPress={onClose}
                style={{ ...styles.button, backgroundColor: "lightgray" }}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )
        }
        refreshControl={isViewing ? refreshControl : null}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() => (!isViewing ? addFriendToShare(item) : null)}
              style={
                selectedFriends.includes(item) || isViewing
                  ? styles.button
                  : { ...styles.button, backgroundColor: "lightgray" }
              }
            >
              <Text style={styles.buttonText}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
    borderRadius: 10,
    padding: 12,
    width: 200,
  },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
  horizontalContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  input: {
    backgroundColor: "white",
    borderColor: "#679b9b",
    borderRadius: 5,
    borderWidth: 2,
    flex: 2,
    height: 50,
    padding: 6,
  },
});

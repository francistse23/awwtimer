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
  getFriends = null,
  isViewing = false,
  onClose,
  refreshControl,
}) {
  const [friendName, setFriendName] = React.useState("");
  const [selectedFriends, setSelectedFriends] = React.useState([]);
  const [addSuccess, setAddSuccess] = React.useState(null);
  const [addError, setAddError] = React.useState(null);

  const addFriendAPICall = async (user, friend) => {
    try {
      const data = { [user]: true };

      await fetch(`https://awwtimer.firebaseio.com/friends/${friend}.json`, {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        method: "patch",
        mode: "cors",
      });
    } catch (err) {
      setAddError(`error adding friend: ${friend}`);
      throw new Error(err);
    }
  };

  const addFriend = async (friendName) => {
    try {
      setAddError(null);
      setAddSuccess(null);

      const [name, code] = friendName.split("#");

      if (friends.includes(name)) {
        setAddError(`already added ${name} as a friend`);
      } else {
        let friendCode = await fetch(
          `https://awwtimer.firebaseio.com/users/${name}.json`
        );

        friendCode = await friendCode.json();

        if (friendCode) {
          if (friendCode === code) {
            // adds friend to your list
            addFriendAPICall(currentUser?.split("#")[0], name);

            // adds you to your friend's list
            addFriendAPICall(name, currentUser?.split("#")[0]);

            setAddSuccess(`Added ${friendName} as a friend!`);
            setFriendName("");
            getFriends();
          } else {
            setAddError("mismatch code ❌");
          }
        } else {
          setAddError("cannot find user 🤔");
        }
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
    <>
      {isViewing && (
        <View>
          <View style={styles.horizontalContainer}>
            <TextInput
              onChangeText={(text) => setFriendName(text)}
              placeholder="e.g. arcsecond#7125"
              placeholderTextColor="#679b9b"
              style={styles.input}
              value={friendName}
            />
            <TouchableOpacity
              disabled={!friendName && friendName.split("#").length < 2}
              onPress={() => addFriend(friendName)}
              style={{ ...styles.button, flex: 1 }}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {addError && (
            <Text style={{ color: "red", fontSize: 16, marginHorizontal: 18 }}>
              {addError}
            </Text>
          )}

          {addSuccess && (
            <Text
              style={{ color: "green", fontSize: 16, marginHorizontal: 24 }}
            >
              {addSuccess}
            </Text>
          )}

          {currentUser && (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                paddingLeft: 25,
                color: "#333",
                marginTop: 10,
              }}
            >{`Connect with friends as ${currentUser}`}</Text>
          )}
        </View>
      )}

      <FlatList
        contentContainerStyle={{
          width: Dimensions.get("window").width,
          marginTop: 20,
        }}
        data={friends}
        keyExtractor={(item) => item}
        ListEmptyComponent={() => (
          <Text>
            {error && "🙈, our code is 💩 and we can't find friends right now"}
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
        ListHeaderComponent={
          <Text
            style={{
              fontSize: 22,
              paddingLeft: 25,
              fontWeight: "bold",
              marginBottom: 10,
              marginTop: 20,
              color: "#333",
            }}
          >
            Your Friends
          </Text>
        }
        numOfColumns={2}
        refreshControl={isViewing ? refreshControl : null}
        renderItem={({ item }) => {
          return isViewing ? (
            <Text
              style={{
                fontSize: 18,
                paddingLeft: 25,
                paddingBottom: 6,
                paddingTop: 4,
                color: "#3b5959",
              }}
            >
              {item}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() => addFriendToShare(item)}
              style={{
                ...styles.button,
                marginBottom: 20,
                backgroundColor: selectedFriends.includes(item)
                  ? "#679b9b"
                  : "lightgray",
              }}
            >
              <Text style={styles.buttonText}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
    borderRadius: 10,
    marginHorizontal: 12,
    padding: 12,
    width: 150,
  },
  buttonContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
  horizontalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 12,
  },
  input: {
    backgroundColor: "transparent",
    borderBottomWidth: 2,
    borderColor: "#679b9b",
    borderRadius: 5,
    flex: 3,
    fontSize: 16,
    height: 50,
    marginHorizontal: 12,
    padding: 6,
  },
  friend: {
    fontSize: 22,
  },
});

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

      let [name, code] = friendName.split("#");
      name = name.toLowerCase();

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
          {currentUser && (
            <Text
              style={styles.altText}
            >{`Connect with friends as ${currentUser}`}</Text>
          )}

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
        </View>
      )}

      <FlatList
        contentContainerStyle={{
          alignItems: "center",
          flex: 1,
          justifyContent: "space-around",
          // paddingVertical: isViewing ? 48 : 16,
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
        ListHeaderComponent={
          <Text style={{ fontSize: 24, textAlign: "center" }}>
            Your friends 😀
          </Text>
        }
        numOfColumns={2}
        refreshControl={isViewing ? refreshControl : null}
        renderItem={({ item }) => {
          return isViewing ? (
            <View style={styles.button}>
              <Text style={styles.buttonText}>{item}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => addFriendToShare(item)}
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
    </>
  );
}

const styles = StyleSheet.create({
  altText: {
    color: "black",
    fontWeight: "600",
    marginVertical: 12,
    textAlign: "center",
  },
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 12,
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
});

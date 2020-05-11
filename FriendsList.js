import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

export default function FriendsList({ aww, isPrize, onClose, currentUser }) {
  const [selectedFriends, setSelectedFriends] = React.useState([]);
  const [friends, setFriends] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async function () {
      try {
        setError(null);
        const friends = await getFriends(currentUser);
        setFriends(friends);
      } catch (e) {
        setError(e);
      }
    })();
  }, []);

  const shareToFriends = async () => {
    try {
      for (let friend of selectedFriends) {
        // to maintain the structure (lessen the work on the prize modal render)
        // passing in the entire media object to store in database
        // we can revisit if this consumes too much data
        const data = {
          [aww.id]: aww,
          // [aww.id]: aww.is_video
          //   ? aww?.crosspost_parent_list?.length > 0
          //     ? aww.crosspost_parent_list[0].secure_media.reddit_video
          //         .fallback_url
          //     : aww.secure_media?.reddit_video?.fallback_url
          //   : aww.url,
        };

        await fetch(`https://awwtimer.firebaseio.com/prizes/${friend}.json`, {
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
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

  const addFriend = (friend) => {
    if (selectedFriends.includes(friend)) {
      let temp = [...selectedFriends];
      temp.splice(selectedFriends.indexOf(friend), 1);

      setSelectedFriends(temp);
    } else {
      setSelectedFriends((selectedFriends) => [...selectedFriends, friend]);
    }
  };

  return (
    <FlatList
      contentContainerStyle={{
        flex: 1,
        justifyContent: "space-between",
        paddingVertical: 16,
      }}
      data={friends}
      keyExtractor={(item) => item}
      ListEmptyComponent={() => (
        <Text>
          {error && "Sry, we suck and can't find your friends"}
          {!error && "find some friends"}
        </Text>
      )}
      ListFooterComponent={() => (
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
      )}
      ListHeaderComponent={() => (
        <Text style={{ fontSize: 24, textAlign: "center" }}>
          Your friends 😀
        </Text>
      )}
      renderItem={({ item }) => {
        return (
          <TouchableOpacity
            onPress={() => addFriend(item)}
            style={
              selectedFriends.includes(item)
                ? styles.button
                : { ...styles.button, backgroundColor: "lightgray" }
            }
          >
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

async function getFriends(currentUser) {
  try {
    console.log(`finding friends for ${currentUser}`);

    // currentUser will log the username with #xxxx
    // split to get the username only
    let response = await fetch(
      `https://awwtimer.firebaseio.com/friends/${
        currentUser.split("#")[0]
      }.json`
    );

    let responseJson = await response.json();

    const friends = Object.entries(responseJson).map(([username, isFriend]) => {
      if (isFriend) return username;
    });

    return friends;
  } catch (error) {
    throw new Error("could not get friends");
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "royalblue",
    borderRadius: 10,
    padding: 12,
    margin: 12,
  },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
});

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

export default function FriendsList({ onClose, currentUser }) {
  const [selectedFriends, setSelectedFriends] = React.useState([]);

  const shareToFriends = async () => {
    try {
      for (let friend of selectedFriends) {
        const data = [
          aww.is_video ? aww.secure_media?.reddit_video?.dash_url : aww.url,
          // following structure will throw an error
          // {
          //   [aww.id]: aww.is_video
          //     ? aww.secure_media?.reddit_video?.dash_url
          //     : aww.url,
          // },
        ];

        let res = await fetch(
          `https://awwtimer.firebaseio.com/users/${friend}/prizes.json`,
          {
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
            },
            // dont use post or put
            // post, firebase will auto-generate a key/id and use that as the new user object's key, too chaotic
            // put, replaces all users (effectively wiping all users)
            method: "patch",
            mode: "cors",
          }
        );
        // res = await res.json();
        // console.log("After sharing", res);
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
}

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
});

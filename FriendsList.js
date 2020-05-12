import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";

export default function FriendsList({
  aww = {},
  error,
  friends,
  isViewing = false,
  onClose,
  refreshing = false,
  onRefresh = null,
}) {
  const [addingFriend, setAddingFriend] = React.useState(false);
  const [friendName, setFriendName] = React.useState("");
  const [selectedFriends, setSelectedFriends] = React.useState([]);

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

  return (
    <FlatList
      contentContainerStyle={{
        alignItems: "center",
        flex: 1,
        justifyContent: "space-between",
        paddingVertical: isViewing ? 48 : 16,
      }}
      data={friends}
      keyExtractor={(item) => item}
      ListEmptyComponent={() => (
        <Text>
          {error && "Sry, we suck and can't find your friends"}
          {!error && "find some friends"}
        </Text>
      )}
      ListFooterComponent={
        () =>
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

        // <View>
        //   {addingFriend && (
        //     <TextInput
        //       onChangeText={(text) => setFriendName(text)}
        //       value={friendName}
        //     />
        //   )}
        //   <TouchableOpacity style={styles.button}>
        //     <Text style={styles.buttonText}>{`Add ${
        //       addingFriend ? friendName : "Friend"
        //     }`}</Text>
        //   </TouchableOpacity>
        // </View>
      }
      ListHeaderComponent={() => (
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 24, textAlign: "center" }}>
            Your friends 😀
          </Text>
          {isViewing && (
            <TouchableOpacity>
              <Image
                source={{ uri: "./assets/add.png" }}
                style={{ height: 32, width: 32 }}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      refreshing={refreshing}
      onRefresh={() => onRefresh()}
      renderItem={({ item }) => {
        return (
          <TouchableOpacity
            onPress={() => addFriendToShare(item)}
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
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

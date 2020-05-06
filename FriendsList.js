import React from "react";

export default function FriendsList({
  friends,
  selectedFriends,
  setSelectedFriends,
  shareToFriends,
}) {
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

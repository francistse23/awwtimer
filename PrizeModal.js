import React from "react";
import FriendsList from "./FriendsList";
import { Share, StyleSheet } from "react-native";

export default function PrizeModal({ aww, friends, onClose, ShareBtn }) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [selectedFriends, setSelectedFriends] = React.useState([]);
  const videoRef = React.useRef(null);

  // moved randomImage out because tapping button causes rerender

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

  return (
    <Modal
      statusBarTranslucent={false}
      style={{ flex: 1, width: "100%" }}
      visible={true}
    >
      <View style={{ alignItems: "center", flex: 1, paddingVertical: 8 }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ alignSelf: "flex-start", margin: 8 }}
        >
          <Text style={{ fontSize: 30 }}>X</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: "center" }}>{aww.title}</Text>

        {aww.url.endsWith(".jpg") ? (
          <Image
            resizeMode="contain"
            source={{
              uri: aww.url,
            }}
            style={{
              width: Dimensions.get("window").width * 0.7,
              height: Dimensions.get("window").height * 0.7,
            }}
          />
        ) : (
          <>
            {/* poster image ? */}
            <Video
              isLooping
              onLoad={() => videoRef.current.presentFullscreenPlayer()}
              ref={videoRef}
              resizeMode="contain"
              shouldPlay
              source={{
                uri: aww.secure_media?.reddit_video?.dash_url,
              }}
              style={{ flex: 1 }}
              useNativeControls
            />
          </>
        )}

        <ShareBtn />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "royalblue",
    borderRadius: 10,
    padding: 12,
    margin: 12,
  },
});

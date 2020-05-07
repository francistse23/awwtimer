import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video } from "expo-av";

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

export default function PrizeModal({ aww, onClose, ShareBtn }) {
  const videoRef = React.useRef(null);

  if (!aww) return <Text style={{ textAlign: "center" }}>💩</Text>;

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

        <>
          <Text style={{ textAlign: "center" }}>{aww.title}</Text>

          {aww.url.endsWith(".jpg") && (
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
          )}

          {aww?.secure_media?.oembed && (
            <Image
              resizeMode="contain"
              source={{
                uri: aww.secure_media.oembed.thumbnail_url,
              }}
              style={{
                width: Dimensions.get("window").width * 0.7,
                height: Dimensions.get("window").height * 0.7,
              }}
            />
          )}

          {!aww.url.endsWith(".jpg") && (
            <>
              <Video
                isLooping
                onLoad={() => videoRef.current.presentFullscreenPlayer()}
                ref={videoRef}
                resizeMode="contain"
                shouldPlay
                source={{
                  uri:
                    aww?.crosspost_parent_list?.length > 0
                      ? aww.crosspost_parent_list[0].secure_media.reddit_video
                          .fallback_url
                      : aww.secure_media?.reddit_video?.fallback_url,
                }}
                style={{ flex: 1 }}
                useNativeControls
              />
            </>
          )}
          <ShareBtn />
        </>
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

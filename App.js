import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";

export default function App() {
  const [awws, setAwws] = React.useState([]);

  React.useEffect(() => {
    async function getData() {
      const response = await fetch("https://www.reddit.com/r/aww/hot.json");
      const data = await response.json();
      const posts = data?.data?.children?.map((c) => c.data) ?? [];
      const images = posts
        .filter((p) => p.url.endsWith(".jpg"))
        .map((i) => i.url);
      setAwws(images);
    }

    getData();
  }, []);

  const randomImage = Math.floor(Math.random() * awws.length);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: awws[randomImage] }}
        style={{ minHeight: 200, width: "100%" }}
      />
      <Text>awwww</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});

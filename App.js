import React from "react";
import { Video } from "expo-av";

import App2 from "./App2";

// add button to view next prize(s)
// remove loading flag in Prize
// bump version

export default function App() {
  const [videoRef, setVideoRef] = React.useState(null);

  return (
    <>
      <Video
        isLooping
        ref={(theRef) => setVideoRef(theRef)}
        resizeMode="contain"
        style={{ flex: 1, display: "none" }}
        useNativeControls
      />
      <App2 videoRef={videoRef} />
    </>
  );
}

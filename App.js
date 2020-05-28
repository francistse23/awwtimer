import React from "react";
import { Video } from "expo-av";

import App2 from "./App2";

// add button to view next prize(s)
// add button to cancel timer
// get rid of the swipe
// remove loading flag in Prize
// fix button styling
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

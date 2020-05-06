import React from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";

// function uuidv4() {
//     return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//       var r = (Math.random() * 16) | 0,
//         v = c == "x" ? r : (r & 0x3) | 0x8;
//       return v.toString(16);
//     });
//   }

function generateCode(){
    let code = "", random = "0123456789";

    while (code.length < 4) {
        code += random[Math.floor(Math.random() * 11))]
    }

    console.log("code generated:", code)

    return code;
}

export default function SignUpForm({ setLoading, setCurrentUser }) {
  const [username, setUsername] = React.useState("");
  const appNamespace = "awwtimer-";

  const createUser = async () => {
    try {
      const data = {
        [username]: true,
      };

      let res = await fetch("https://awwtimer.firebaseio.com/users.json", {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        // dont use post or put
        // post, firebase will auto-generate a key/id and use that as the new user object's key, too chaotic
        // put, replaces all users (effectively wiping all users)
        method: "patch",
        mode: "cors",
      });

      res = await res.json();

      storeCredentials(username);

      setCurrentUser(username);

      setLoading(false);
    } catch (err) {
      throw new Error(err);
    }
  };

  // stores user credentials to the platform's secure keychain
  const storeCredentials = async (username) => {
    const secureStoreOptions = {
      keychainService: Platform.OS === "ios" ? "iOS" : "Android",
    };
    await SecureStore.setItemAsync(
      `${appNamespace}username`,
      username,
      secureStoreOptions
    );
  };

  return (
    <>
      <TextInput
        onChangeText={(text) => setUsername(text)}
        placeholder="username"
        style={styles.input}
        value={username}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setLoading(true);
          createUser();
        }}
      >
        <Text style={styles.buttonText}>Create User :)</Text>
      </TouchableOpacity>
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
  input: {
    borderColor: "black",
    borderRadius: 12,
    borderWidth: 1,
    margin: 8,
    padding: 8,
    width: "60%",
  },
});

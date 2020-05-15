import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";

function generateCode() {
  let code = "",
    random = "0123456789";

  while (code.length < 4) {
    code += random[Math.floor(Math.random() * 10)];
  }

  return code;
}

export default function SignUpForm({ onUserCreated }) {
  const [username, setUsername] = React.useState("");
  const [error, setError] = React.useState(null);
  const appNamespace = "awwtimer-";

  const createUser = async () => {
    try {
      setError(null);
      let isExisting = await fetch(
        `https://awwtimer.firebaseio.com/users/${username}.json`
      );

      isExisting = await isExisting.json();

      if (isExisting) {
        setError("Username in use 😢");
      } else {
        const code = generateCode();
        const data = {
          [username]: code,
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

        storeCredentials(username, code);

        onUserCreated(`${username}#${code}`);
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  // stores user credentials to the platform's secure keychain
  const storeCredentials = async (username, code) => {
    const secureStoreOptions = {
      keychainService: Platform.OS === "ios" ? "iOS" : "Android",
    };
    await SecureStore.setItemAsync(
      `${appNamespace}username`,
      `${username}#${code}`,
      secureStoreOptions
    );
  };

  return (
    <View style={{ paddingVertical: 50 }}>
      <TextInput
        onChangeText={(text) => setUsername(text)}
        placeholder="username"
        placeholderTextColor="#679b9b"
        style={styles.input}
        value={username}
      />

      {error && (
        <Text style={{ color: "red", fontSize: 16, marginHorizontal: 24 }}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          createUser();
        }}
      >
        <Text style={styles.buttonText}>Create User :)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#679b9b",
    borderColor: "white",
    borderRadius: 10,
    borderWidth: 3,
    margin: 12,
    padding: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "transparent",
    borderBottomWidth: 2,
    borderColor: "#679b9b",
    borderRadius: 5,
    fontSize: 20,
    margin: 16,
    padding: 8,
    width: 200,
  },
});

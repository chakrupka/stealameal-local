import { StyleSheet, Platform, StatusBar } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#096A2E",
    alignItems: "center",
  },

  content: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 80 : StatusBar.currentHeight + 50, 
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#096A2E",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    zIndex: 1000,
  },


  avatar: {
    marginLeft: -10, 
    marginRight: 25, 
  },

  largeLogo: {
    width: 350,
    height: 350,
    resizeMode: "contain",
    marginBottom: 40,
  },

  title: {
    fontSize: 26,
    color: "#fff",
    marginBottom: 30,
    fontFamily: "HammersmithOne_400Regular",
    textAlign: "center",
  },

  buttonContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    width: 250,
    marginVertical: 10,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#5D4E8E",
  },

  inputLarge: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 250, 
    fontSize: 18, 
    fontFamily: "DMSans_400Regular",
  },

  errorText: {
    color: "red",
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginVertical: 10,
    paddingLeft: 10,
    fontFamily: "DMSans_400Regular",
  },

  listItem: {
    marginVertical: 5,
    borderRadius: 5,
  },

  imageContainer: {
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadText: {
    color: "white",
    fontSize: 16,
  },
});

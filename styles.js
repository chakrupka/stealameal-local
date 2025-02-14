import { StyleSheet, Platform, StatusBar } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  header: {
    position: "absolute",
    width: 373,
    height: 163,
    left: 25,
    top: 70,
    fontFamily: "Inter",
    fontStyle: "italic",
    fontWeight: "100",
    fontSize: 50,
    lineHeight: 61,
    textAlign: "center",
    color: "#000000",
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  // SUBHEADER
  subheader: {
    position: "absolute",
    width: 373,
    height: 35,
    left: 25,
    top: 203,
    fontFamily: "Inter",
    fontStyle: "italic",
    fontWeight: "100",
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
    color: "#000000",
  },
  // DATE/TIME
  dateTimeContainer: {
    position: "absolute",
    left: 40,
    top: 250,
    width: 215,
    height: 34,
    borderRadius: 6,
    backgroundColor: "rgba(174,207,117,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  // SEND BUTTON
  sendButton: {
    position: "absolute",
    left: 290,
    top: 240,
    width: 100,
    height: 52,
    backgroundColor: "rgba(174,207,117,0.75)",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  // LIST container
  listContainer: {
    position: "absolute",
    top: 300,
    alignSelf: "center",
    width: 360,
    height: 500,
    backgroundColor: "rgba(174,207,117,0.75)",
  },
  // list item
  listItem: {
    width: 360,
    height: 56,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
  },
  // contact icon
  listItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginRight: 10,
  },
  // contact name
  listItemContent: {
    width: 212,
    height: 40,
    justifyContent: "center",
  },
  // checkbox
  listItemCheckbox: {
    width: 44,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  // BOTTOM container – for back arrow and the “Ping Friends Now” button
  bottomContainer: {
    position: "absolute",
    bottom: 30,
    left: 10,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 70,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  pingButton: {
    width: 165,
    height: 40,
    backgroundColor: "rgba(174,207,117,0.75)",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  pingButtonLabel: {
    width: 117,
    height: 20,
    fontFamily: "Roboto",
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    letterSpacing: 0.1,
    color: "#3D2200",
  },
});

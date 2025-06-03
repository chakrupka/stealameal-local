import { StyleSheet, Platform, StatusBar } from 'react-native';

const COLORS = {
  primary: '#096A2E',
  secondary: 'rgba(174,207,117,0.75)',
  white: '#FFFFFF',
  black: '#000000',
  purple: '#5D4E8E',
  red: 'red',
  lightgrey: '#D9D9D9',
  selectedItem: '#74C69D',
  textDark: '#3D2200',
};

const SPACING = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 25,
  xxl: 30,
  xxxl: 40,
};

const SIZES = {
  avatar: 40,
  buttonWidth: {
    standard: 165,
    large: 250,
  },
  buttonHeight: {
    standard: 40,
    large: 52,
  },
  iconSize: {
    small: 24,
    medium: 40,
  },
  headerWidth: 373,
  container: {
    standard: 30,
    small: 215,
    medium: 360,
  },
  listHeight: 525,
  borderRadius: {
    small: 5,
    medium: 6,
    large: 8,
    pill: 30,
    circle: 50,
    fullCircle: 100,
  },
};

const TYPOGRAPHY = {
  header: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 50,
    lineHeight: 61,
  },
  subheader: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 20,
    lineHeight: 24,
  },
  button: {
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'HammersmithOne_400Regular',
  },
  body: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
  },
  input: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
  },
};

export const BOX_SHADOW = {
  shadowColor: COLORS.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.2,
};

export const FLEX_ROW_CENTER = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
};

export const FLEX_COL_CENTER = {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

export const FILL_HEIGHT_WIDTH = {
  height: '100%',
  width: '100%',
};

export default StyleSheet.create({
  // ========= LAYOUT & CONTAINERS =========
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },

  content: {
    flex: 1,
    marginTop:
      Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },

  starterScreenContainer: {
    ...FLEX_COL_CENTER,
    gap: 20,
  },

  createAccountContainer: {
    ...FLEX_COL_CENTER,
    ...FILL_HEIGHT_WIDTH,
    paddingBottom: 100,
    backgroundColor: COLORS.white,
    gap: 10,
  },

  createAccountHeader: {
    ...TYPOGRAPHY.header,
    width: SIZES.headerWidth,
    textAlign: 'center',
    color: COLORS.black,
    borderWidth: 0.5,
    borderColor: COLORS.black,
  },

  createAccountProfilePicContainer: {
    height: 100,
    width: 100,
    borderColor: 'grey',
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderRadius: 50,
    overflow: 'hidden',
  },

  createAccountProfilePicImage: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
  },

  createAccountProfilePicSubheader: {
    color: '#bbb',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 10,
  },

  createAccountInputContainer: {
    width: 247,
    height: 42,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#8B8B8B',
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: SPACING.sm,
  },

  loginContainer: {
    ...FLEX_COL_CENTER,
    ...FILL_HEIGHT_WIDTH,
    backgroundColor: COLORS.white,
    paddingBottom: 75,
    gap: 15,
  },

  loginHeader: {
    fontSize: 40,
    fontWeight: 300,
    color: '#444',
    textAlign: 'center',
  },

  loginInputContainer: {
    width: 247,
    height: 42,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#8B8B8B',
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: SPACING.sm,
  },

  // ========= NAVIGATION =========
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 115,
    width: '100%',
    ...FLEX_ROW_CENTER,
    justifyContent: 'space-between',
    zIndex: 1000,
    // backgroundColor: '#6750a4',
  },

  navIcon: { paddingBottom: 5, paddingLeft: 15, color: 'white' },

  accountIcon: {
    paddingRight: 10,
  },

  navTitle: {
    fontSize: 26,
    paddingBottom: 5,
    marginLeft: -15,
    marginRight: -20,
    fontWeight: '700',
  },

  navPlaceholder: {
    width: 35,
    height: 35,
    marginRight: 20,
  },

  // ========= TEXT STYLES =========
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.white,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },

  header: {
    ...TYPOGRAPHY.header,
    textAlign: 'center',
    color: COLORS.black,
    borderWidth: 0.5,
    borderColor: COLORS.black,
  },

  subheader: {
    ...TYPOGRAPHY.subheader,
    textAlign: 'center',
    color: COLORS.black,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },

  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.primary,
    ...TYPOGRAPHY.body,
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginVertical: SPACING.sm,
    paddingLeft: SPACING.sm,
    fontFamily: 'DMSans_400Regular',
  },

  uploadText: {
    color: COLORS.white,
    ...TYPOGRAPHY.body,
  },

  // ========= BUTTON STYLES =========
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    width: SIZES.buttonWidth.large,
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderRadius: SIZES.borderRadius.pill,
    backgroundColor: COLORS.purple,
  },

  pingButton: {
    width: SIZES.buttonWidth.standard,
    height: SIZES.buttonHeight.standard,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.borderRadius.fullCircle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pingButtonLabel: {
    width: 117,
    height: SPACING.lg,
    ...TYPOGRAPHY.button,
    textAlign: 'center',
    color: COLORS.textDark,
  },

  backButton: {
    width: 70,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },

  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.medium,
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },

  starterAuthButton: {
    backgroundColor: COLORS.lightgrey,
    width: 268,
    borderRadius: SIZES.borderRadius.large,
    ...BOX_SHADOW,
  },

  starterButtonText: {
    fontFamily: TYPOGRAPHY.button.fontFamily,
    fontWeight: '400',
    fontSize: 22,
    lineHeight: 32,
    color: 'black',
    textAlign: 'center',
  },

  createAccountButton: {
    width: 247,
    height: 42,
    marginTop: 10,
    backgroundColor: '#6750a4',
    borderRadius: SIZES.borderRadius.large,
    ...BOX_SHADOW,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButton: {
    width: 247,
    height: 42,
    backgroundColor: '#6750a4',
    borderRadius: SIZES.borderRadius.large,
    ...BOX_SHADOW,
    elevation: 3,
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========= FORM ELEMENTS =========
  inputLarge: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: SIZES.borderRadius.large,
    marginBottom: SPACING.lg,
    width: SIZES.buttonWidth.large,
    ...TYPOGRAPHY.input,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.borderRadius.medium,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },

  searchInput: {
    flex: 1,
    height: SIZES.buttonHeight.standard,
    color: COLORS.black,
    ...TYPOGRAPHY.input,
    paddingLeft: SPACING.sm,
  },

  createAccountInput: {
    width: '100%',
    height: '100%',
    ...TYPOGRAPHY.input,
  },

  loginInput: {
    width: '100%',
    height: '100%',
    ...TYPOGRAPHY.input,
  },

  // ========= IMAGES AND LOGOS =========
  largeLogo: {
    width: SIZES.container.standard - 30,
    height: SIZES.container.standard - 30,
    resizeMode: 'contain',
    marginBottom: SPACING.xl,
  },

  imageContainer: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  profilePic: {
    width: SIZES.container.small - 115,
    height: SIZES.container.small - 115,
    borderRadius: SIZES.borderRadius.circle,
  },

  starterBackgroundImage: {
    width: '90%',
    top: SPACING.xxxl,
  },
  scheduleItem: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderRadius: 4,
    padding: 4,
    justifyContent: 'center',
    borderLeftWidth: 3,
    elevation: 1,
  },
  scheduleItemName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleItemCategory: {
    fontSize: 7,
    color: '#666',
    textTransform: 'capitalize',
  },
  starterRaccoonImage: {
    position: 'absolute',
    width: 102,
    height: 134,
    left: 120,
    top: 700,
  },

  starterHamburgerImage: {
    position: 'absolute',
    width: 133,
    height: 129,
    left: 200,
    top: 600,
  },

  createAccountLogo: {
    width: 133,
    height: 128,
    top: 420,
    alignSelf: 'center',
    resizeMode: 'contain',
  },

  // ========= LIST STYLES =========
  listContainer: {
    alignSelf: 'center',
    width: SIZES.container.standard,
    height: SIZES.listHeight,
    backgroundColor: COLORS.secondary,
  },

  listItem: {
    width: SIZES.container.medium + 10,
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.black,
    marginVertical: SPACING.xs,
    borderRadius: SIZES.borderRadius.small,
  },

  listItemAvatar: {
    width: SIZES.avatar,
    height: SIZES.avatar,
    borderRadius: SIZES.avatar / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
  },

  listItemContent: {
    width: 212,
    height: SIZES.avatar,
    justifyContent: 'center',
  },

  listItemCheckbox: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========= USER CARD STYLES =========
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.borderRadius.medium,
    padding: SPACING.md,
    marginVertical: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginHorizontal: '5%',
  },

  userCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userCardText: {
    marginLeft: SPACING.sm,
    flexShrink: 1, // Prevents text overflow
  },

  userName: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.body.fontSize,
    fontWeight: 'bold',
  },

  userEmail: {
    color: COLORS.textDark,
    opacity: 0.7,
    fontSize: TYPOGRAPHY.body.fontSize - 2,
    width: 100,
  },

  // ========= CONTAINER POSITIONING =========
  addFriendsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop:
      Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + SPACING.lg,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 250,
    right: SPACING.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========= MAP STYLES =========
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  map: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mapText: {
    color: COLORS.black,
  },

  marker: {
    width: 30,
    height: 30,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  pickerContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
  pickerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerCancel: {
    color: '#6750a4',
    fontSize: 16,
  },
  pickerDone: {
    color: '#6750a4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    height: 200,
    width: '100%',
  },

  initials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ========= PROFILE =========
  profileView: {
    main: {
      ...FLEX_COL_CENTER,
      ...FILL_HEIGHT_WIDTH,
    },
    container: {
      alignItems: 'center',
      justifyContent: 'start',
      marginTop: 120,
      height: '75%',
      width: '75%',
    },
    profilePic: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderColor: '#6750a4',
      borderWidth: 5,
    },
    name: {
      marginTop: 10,
      width: '120%',
      textAlign: 'center',
      fontSize: 35,
    },
    email: {
      marginTop: 5,
      color: '#555',
    },
    editContainer: {
      alignItems: 'center',
      justifyContent: 'start',
      marginTop: 120,
      height: '75%',
      width: '75%',
      gap: 10,
    },
    editPicContainer: {
      ...FLEX_COL_CENTER,
      width: 150,
      height: 150,
      borderRadius: 75,
      borderColor: '#8B8B8B',
      borderWidth: 2,
      backgroundColor: 'white',
      overflow: 'hidden',
      marginBottom: 10,
    },
    editProfilePic: {
      ...FILL_HEIGHT_WIDTH,
      ...FLEX_COL_CENTER,
    },
    editProfilePicShade: {
      position: 'absolute',
      height: 150,
      width: 150,
      opacity: 0.5,
      backgroundColor: '#aaa',
    },
    editProfilePicIcon: {
      position: 'absolute',
      paddingLeft: 52,
      paddingTop: 50,
      height: 150,
      width: 150,
    },
    input: {
      width: '110%',
      height: 40,
      backgroundColor: 'white',
      borderWidth: 1.5,
      borderColor: '#8B8B8B',
      borderRadius: SIZES.borderRadius.large,
      fontSize: 20,
      paddingRight: 10,
      paddingLeft: 10,
    },
    editButtons: {
      width: '120%',
      ...FLEX_ROW_CENTER,
    },
    button: {
      width: 120,
      height: 42,
      margin: 10,
      backgroundColor: '#6750a4',
      borderRadius: SIZES.borderRadius.large,
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
});

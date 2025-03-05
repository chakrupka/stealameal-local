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
    fontWeight: '100',
    fontSize: 50,
    lineHeight: 61,
  },
  subheader: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontWeight: '100',
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
    backgroundColor: COLORS.primary,
    position: 'relative',
    alignItems: 'flex-start',
  },

  createAccountContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  createAccountHeader: {
    ...TYPOGRAPHY.header,
    width: SIZES.headerWidth,
    textAlign: 'center',
    color: COLORS.black,
    borderWidth: 0.5,
    borderColor: COLORS.black,
  },

  createAccountInputContainer: {
    width: 247,
    height: 42,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#8B8B8B',
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  },

  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  loginHeader: {
    ...TYPOGRAPHY.header,
    width: SIZES.headerWidth,
    textAlign: 'center',
    color: COLORS.black,
    borderWidth: 0.5,
    borderColor: COLORS.black,
  },

  loginInputContainer: {
    width: 247,
    height: 42,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#8B8B8B',
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  },

  // ========= NAVIGATION =========
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? SPACING.xl : StatusBar.currentHeight + SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 1000,
  },

  avatar: {
    marginLeft: -SPACING.sm,
    marginRight: SPACING.xl,
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

  starterLoginButtonContainer: {
    position: 'absolute',
    width: 268,
    height: 59,
    left: 75,
    top: 400,
  },

  starterCreateAccountButtonContainer: {
    position: 'absolute',
    width: 268,
    height: 59,
    left: 75,
    top: 490,
  },

  starterAuthButton: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightgrey,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: SIZES.borderRadius.large,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    justifyContent: 'center',
  },

  starterButtonText: {
    fontFamily: TYPOGRAPHY.button.fontFamily,
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.textDark,
    textAlign: 'center',
  },

  createAccountButton: {
    width: 247,
    height: 42,
    top: 370,
    left: 90,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.borderRadius.large,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButton: {
    width: 247,
    height: 42,
    top: 350,
    left: 90,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.borderRadius.large,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.2,
    elevation: 3,
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
    width: '110%',
    height: 470,
    position: 'absolute',
    left: -17,
    top: SPACING.xxxl,
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

  resultsContentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  // ========= USER CARD STYLES =========
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    color: '#5C4D7D',
    fontSize: 16,
  },
  pickerDone: {
    color: '#5C4D7D',
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
});

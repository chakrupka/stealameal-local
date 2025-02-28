import { StyleSheet, Platform, StatusBar } from 'react-native';

const COLORS = {
  primary: '#096A2E',
  secondary: 'rgba(174,207,117,0.75)', // Light green
  white: '#FFFFFF',
  black: '#000000',
  purple: '#5D4E8E',
  red: 'red',
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
    standard: 380,
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

  // ========= NAVIGATION =========
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: '#007AFF', // Custom background color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  initials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

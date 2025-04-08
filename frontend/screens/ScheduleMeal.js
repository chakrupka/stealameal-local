// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   SafeAreaView,
//   Alert,
//   Modal,
//   ScrollView,
//   Platform,
// } from 'react-native';
// import {
//   Text,
//   Avatar,
//   Button,
//   TextInput,
//   RadioButton,
//   Checkbox,
//   Divider,
// } from 'react-native-paper';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import styles from '../styles';
// import TopNav from '../components/TopNav';
// import useStore from '../store';
// import { fetchFriendDetails } from '../services/user-api';

// // Predefined location options
// const LOCATION_OPTIONS = ['Foco', 'Collis', 'Novack', 'Fern', 'Hop'];

// // Maps time of day to meal type
// const getMealType = (hours) => {
//   if (hours >= 5 && hours < 11) return 'breakfast';
//   if (hours >= 11 && hours < 16) return 'lunch';
//   return 'dinner';
// };

// // Format time to HH:MM format for the API
// // Format time to HH:MM format for the API with validation against schema enum values
// // Format time to HH:MM format for the API with support for 24-hour times
// const formatTimeForApi = (date) => {
//   // Get hours and minutes
//   let hours = date.getHours();
//   const minutes = date.getMinutes();

//   // Round minutes to nearest quarter hour (0, 15, 30, 45)
//   let roundedMinutes = Math.round(minutes / 15) * 15;

//   // Handle case where minutes round to 60
//   if (roundedMinutes === 60) {
//     roundedMinutes = 0;
//     hours = (hours + 1) % 24;
//   }

//   // Format to two digits
//   const formattedHours = hours.toString().padStart(2, '0');
//   const formattedMinutes = roundedMinutes.toString().padStart(2, '0');

//   // Format as HH:MM
//   const timeString = `${formattedHours}:${formattedMinutes}`;

//   // Generate complete list of valid times for 24 hours at 15-minute intervals
//   const generateValidTimes = () => {
//     const times = [];
//     for (let h = 0; h < 24; h++) {
//       for (let m of [0, 15, 30, 45]) {
//         times.push(
//           `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
//         );
//       }
//     }
//     return times;
//   };

//   const allPossibleTimes = generateValidTimes();

//   // Find the closest valid time
//   if (!allPossibleTimes.includes(timeString)) {
//     console.warn(
//       `Unexpected time format: ${timeString}. Finding closest valid time.`,
//     );

//     // This shouldn't happen with our rounding logic above, but just in case,
//     // return the nearest valid time by finding the one that minimizes the
//     // absolute difference in minutes

//     const timeToMinutes = (timeStr) => {
//       const [h, m] = timeStr.split(':').map(Number);
//       return h * 60 + m;
//     };

//     const selectedTimeInMinutes = timeToMinutes(timeString);

//     let closestTime = allPossibleTimes[0];
//     let minDifference = Math.abs(
//       timeToMinutes(closestTime) - selectedTimeInMinutes,
//     );

//     for (const validTime of allPossibleTimes) {
//       const difference = Math.abs(
//         timeToMinutes(validTime) - selectedTimeInMinutes,
//       );
//       if (difference < minDifference) {
//         minDifference = difference;
//         closestTime = validTime;
//       }
//     }

//     return closestTime;
//   }

//   return timeString;
// };

// export default function ScheduleMeal({ navigation, route }) {
//   const profilePic = route.params?.profilePic || null;
//   const [friends, setFriends] = useState([]);
//   const [squads, setSquads] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedFriends, setSelectedFriends] = useState([]);
//   const [selectedSquads, setSelectedSquads] = useState([]);
//   const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'squads'
//   const [dataLoaded, setDataLoaded] = useState(false);

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedTime, setSelectedTime] = useState(new Date());
//   const [tempDate, setTempDate] = useState(new Date());
//   const [tempTime, setTempTime] = useState(new Date());
//   const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
//   const [mealName, setMealName] = useState('');
//   const [notes, setNotes] = useState('');
//   const [showDetailsModal, setShowDetailsModal] = useState(false);

//   const currentUser = useStore((state) => state.userSlice.currentUser);
//   const userSquads = useStore((state) => state.squadSlice.squads);
//   const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);
//   const createMeal = useStore((state) => state.mealSlice.createMeal);
//   const getAllSquads = useStore((state) => state.squadSlice.getAllSquads);

//   const loadData = useCallback(async () => {
//     if (dataLoaded || !currentUser?.userID) return;

//     setLoading(true);
//     try {
//       if (userSquads.length === 0) {
//         const fetchedSquads = await getUserSquads(currentUser.userID);
//         setSquads(fetchedSquads || []);
//       } else {
//         setSquads(userSquads);
//       }

//       // Process friends
//       if (currentUser?.friendsList && currentUser.friendsList.length > 0) {
//         const friendsData = await Promise.all(
//           currentUser.friendsList.map(async (friend) => {
//             try {
//               const details = await fetchFriendDetails(
//                 currentUser.idToken,
//                 friend.friendID,
//               );

//               return {
//                 id: friend.friendID,
//                 name: `${details.firstName} ${details.lastName}`,
//                 email: details.email,
//                 type: 'friend',
//                 mongoId: details._id, // Store MongoDB ID for API calls
//                 initials: `${details.firstName.charAt(
//                   0,
//                 )}${details.lastName.charAt(0)}`.toUpperCase(),
//               };
//             } catch (error) {
//               console.error('Error fetching friend details:', error);
//               return {
//                 id: friend.friendID,
//                 name: 'Unknown Friend',
//                 email: 'Unknown',
//                 type: 'friend',
//                 initials: '??',
//               };
//             }
//           }),
//         );
//         setFriends(friendsData);
//       }

//       setDataLoaded(true);
//     } catch (error) {
//       console.error('Error loading data:', error);
//       Alert.alert('Error', 'Failed to load friends and squads');
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser, getUserSquads, userSquads, dataLoaded]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   useEffect(() => {
//     const timeOfDay = getMealType(selectedTime.getHours());
//     const defaultName = `${timeOfDay.charAt(0).toUpperCase()}${timeOfDay.slice(
//       1,
//     )} at ${location}`;
//     setMealName(defaultName);
//   }, [selectedTime, location]);

//   const toggleFriendSelection = (id, type, mongoId) => {
//     setSelectedFriends((prev) => {
//       if (prev.some((item) => item.id === id)) {
//         return prev.filter((item) => item.id !== id);
//       }
//       return [...prev, { id, type, mongoId }];
//     });
//   };

//   const toggleSquadSelection = (squadId) => {
//     setSelectedSquads((prev) => {
//       if (prev.includes(squadId)) {
//         return prev.filter((id) => id !== squadId);
//       }
//       return [...prev, squadId];
//     });
//   };

//   const renderFriendItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         localStyles.friendItem,
//         selectedFriends.some((selected) => selected.id === item.id) &&
//           localStyles.selectedItem,
//       ]}
//       onPress={() => toggleFriendSelection(item.id, item.type, item.mongoId)}
//     >
//       <View style={localStyles.avatarContainer}>
//         <Avatar.Text
//           size={50}
//           label={item.initials}
//           style={localStyles.avatar}
//         />
//       </View>
//       <View style={localStyles.friendInfo}>
//         <Text style={localStyles.friendName}>{item.name}</Text>
//         <Text style={localStyles.friendEmail}>{item.email}</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderSquadItem = ({ item }) => (
//     <TouchableOpacity
//       style={[
//         localStyles.squadItem,
//         selectedSquads.includes(item._id) && localStyles.selectedItem,
//       ]}
//       onPress={() => toggleSquadSelection(item._id)}
//     >
//       <View style={localStyles.squadHeader}>
//         <Text style={localStyles.squadName}>{item.squadName}</Text>
//         <Checkbox
//           status={selectedSquads.includes(item._id) ? 'checked' : 'unchecked'}
//           onPress={() => toggleSquadSelection(item._id)}
//           color="#5C4D7D"
//         />
//       </View>
//       <Text style={localStyles.squadMembersCount}>
//         {item.members.length} members
//       </Text>
//     </TouchableOpacity>
//   );

//   const handleDateChange = (event, date) => {
//     if (Platform.OS === 'android') {
//       setShowDatePicker(false);
//       if (date) {
//         setSelectedDate(date);
//       }
//     } else {
//       // For iOS, update the tempDate
//       if (date) {
//         setTempDate(date);
//       }
//     }
//   };

//   const handleTimeChange = (event, time) => {
//     if (Platform.OS === 'android') {
//       setShowTimePicker(false);
//       if (time) {
//         setSelectedTime(time);
//         // Update meal name when time changes
//         const timeOfDay = getMealType(time.getHours());
//         const defaultName = `${timeOfDay
//           .charAt(0)
//           .toUpperCase()}${timeOfDay.slice(1)} at ${location}`;
//         setMealName(defaultName);
//       }
//     } else {
//       // For iOS, update the tempTime
//       if (time) {
//         setTempTime(time);
//       }
//     }
//   };

//   const formatDate = (date) => {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const formatTime = (time) => {
//     return time.toLocaleTimeString('en-US', {
//       hour: 'numeric',
//       minute: '2-digit',
//     });
//   };

//   const showMealDetails = () => {
//     if (selectedFriends.length === 0 && selectedSquads.length === 0) {
//       Alert.alert('Error', 'Please select at least one friend or squad');
//       return;
//     }
//     setShowDetailsModal(true);
//   };

//   const scheduleMeal = async () => {
//     if (selectedFriends.length === 0 && selectedSquads.length === 0) {
//       Alert.alert('Error', 'Please select at least one friend or squad');
//       return;
//     }

//     if (!mealName) {
//       Alert.alert('Error', 'Please enter a meal name');
//       return;
//     }

//     try {
//       setLoading(true);

//       const participants = selectedFriends.map((item) => ({
//         userID: item.mongoId, // Use the MongoDB _id for participant references
//         status: 'invited', // Match the status enum in the schema
//       }));

//       const date = new Date(selectedDate);
//       date.setHours(selectedTime.getHours());
//       date.setMinutes(selectedTime.getMinutes());

//       const mealType = getMealType(selectedTime.getHours());

//       const timeString = formatTimeForApi(selectedTime);

//       const mealData = {
//         mealName: mealName,
//         host: currentUser._id, // Use MongoDB _id for host
//         date: date, // Full date object
//         time: timeString, // Time as string matching schema enum
//         location: location,
//         notes: notes,
//         participants: participants,
//         squadIds: selectedSquads, // Send squad IDs for processing on server
//         mealType: mealType, // breakfast, lunch, or dinner based on time
//       };

//       console.log(
//         'Scheduling meal with data:',
//         JSON.stringify(mealData, null, 2),
//       );

//       const result = await createMeal(mealData);
//       console.log('Meal created:', result);

//       setShowDetailsModal(false);
//       setSelectedFriends([]);
//       setSelectedSquads([]);
//       setLocation(LOCATION_OPTIONS[0]);
//       setNotes('');

//       Alert.alert('Success', `Meal "${mealName}" scheduled successfully`, [
//         {
//           text: 'OK',
//           onPress: () =>
//             navigation.navigate('ViewMeals', {
//               profilePic,
//               reloadMeals: true,
//             }),
//         },
//       ]);
//     } catch (error) {
//       console.error('Error scheduling meal:', error);
//       Alert.alert(
//         'Error',
//         'Failed to schedule meal: ' + (error.message || 'Unknown error'),
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const scheduleNow = () => {
//     if (selectedFriends.length === 0 && selectedSquads.length === 0) {
//       Alert.alert('Error', 'Please select at least one friend or squad');
//       return;
//     }

//     // Set time to now + 30 minutes
//     const now = new Date();
//     now.setMinutes(now.getMinutes() + 30);
//     setSelectedDate(now);
//     setSelectedTime(now);
//     setShowDetailsModal(true);
//   };

//   // Render a location option
//   const renderLocationOption = useCallback(
//     (locationName) => (
//       <TouchableOpacity
//         key={locationName}
//         style={localStyles.locationOption}
//         onPress={() => {
//           setLocation(locationName);
//           // Update meal name when location changes
//           const timeOfDay = getMealType(selectedTime.getHours());
//           const defaultName = `${timeOfDay
//             .charAt(0)
//             .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
//           setMealName(defaultName);
//         }}
//       >
//         <RadioButton
//           value={locationName}
//           status={location === locationName ? 'checked' : 'unchecked'}
//           onPress={() => {
//             setLocation(locationName);
//             // Update meal name when location changes
//             const timeOfDay = getMealType(selectedTime.getHours());
//             const defaultName = `${timeOfDay
//               .charAt(0)
//               .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
//             setMealName(defaultName);
//           }}
//           color="#5C4D7D"
//         />
//         <Text style={localStyles.locationOptionText}>{locationName}</Text>
//       </TouchableOpacity>
//     ),
//     [location, selectedTime],
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <TopNav
//         navigation={navigation}
//         title="Schedule Meal"
//         profilePic={profilePic}
//       />
//       <View style={{ height: 50 }} />

//       <View style={localStyles.contentContainer}>
//         <View style={localStyles.headerContainer}>
//           <Text style={localStyles.headerText}>Schedule a Meal</Text>
//         </View>

//         <Text style={localStyles.subheaderText}>
//           Select friends or squads to schedule a meal with.
//         </Text>

//         <View style={localStyles.tabContainer}>
//           <TouchableOpacity
//             style={[
//               localStyles.tab,
//               activeTab === 'friends' && localStyles.activeTab,
//             ]}
//             onPress={() => setActiveTab('friends')}
//           >
//             <Text
//               style={[
//                 localStyles.tabText,
//                 activeTab === 'friends' && localStyles.activeTabText,
//               ]}
//             >
//               Friends
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               localStyles.tab,
//               activeTab === 'squads' && localStyles.activeTab,
//             ]}
//             onPress={() => setActiveTab('squads')}
//           >
//             <Text
//               style={[
//                 localStyles.tabText,
//                 activeTab === 'squads' && localStyles.activeTabText,
//               ]}
//             >
//               Squads
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <View style={localStyles.actionButtonsContainer}>
//           <TouchableOpacity
//             style={localStyles.dateTimeButton}
//             onPress={showMealDetails}
//           >
//             <Text style={localStyles.dateTimeText}>Date/Time</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               localStyles.sendButton,
//               selectedFriends.length === 0 &&
//                 selectedSquads.length === 0 &&
//                 localStyles.disabledButton,
//             ]}
//             disabled={
//               selectedFriends.length === 0 && selectedSquads.length === 0
//             }
//             onPress={showMealDetails}
//           >
//             <Text style={localStyles.sendText}>Send</Text>
//             <MaterialCommunityIcons
//               name="arrow-right"
//               size={20}
//               color="#5C4D7D"
//             />
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <View style={localStyles.loadingContainer}>
//             <Text style={localStyles.loadingText}>Loading...</Text>
//           </View>
//         ) : activeTab === 'friends' ? (
//           <FlatList
//             data={friends}
//             renderItem={renderFriendItem}
//             keyExtractor={(item) => item.id}
//             style={localStyles.friendsList}
//             contentContainerStyle={localStyles.friendsListContent}
//             ListEmptyComponent={
//               <Text style={localStyles.emptyText}>
//                 No friends found. Add friends to schedule meals with them.
//               </Text>
//             }
//           />
//         ) : (
//           <FlatList
//             data={squads}
//             renderItem={renderSquadItem}
//             keyExtractor={(item) => item._id}
//             style={localStyles.friendsList}
//             contentContainerStyle={localStyles.friendsListContent}
//             ListEmptyComponent={
//               <Text style={localStyles.emptyText}>
//                 No squads found. Create a squad to schedule group meals.
//               </Text>
//             }
//           />
//         )}
//       </View>

//       <View style={localStyles.bottomButton}>
//         <TouchableOpacity
//           style={[
//             localStyles.scheduleNowButton,
//             selectedFriends.length === 0 &&
//               selectedSquads.length === 0 &&
//               localStyles.disabledButton,
//           ]}
//           onPress={scheduleNow}
//           disabled={selectedFriends.length === 0 && selectedSquads.length === 0}
//         >
//           <Text style={localStyles.scheduleNowText}>Schedule Meal Now</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Android DateTimePicker */}
//       {Platform.OS === 'android' && showDatePicker && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//         />
//       )}

//       {Platform.OS === 'android' && showTimePicker && (
//         <DateTimePicker
//           value={selectedTime}
//           mode="time"
//           display="default"
//           onChange={handleTimeChange}
//         />
//       )}

//       {/* Meal details modal */}
//       <Modal
//         visible={showDetailsModal}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowDetailsModal(false)}
//       >
//         <View style={localStyles.modalOverlay}>
//           <View style={localStyles.modalContent}>
//             <Text style={localStyles.modalTitle}>Schedule Meal</Text>

//             <ScrollView style={localStyles.modalScroll}>
//               <Text style={localStyles.modalLabel}>Meal Name:</Text>
//               <TextInput
//                 style={localStyles.textInput}
//                 placeholder="Give your meal a name"
//                 value={mealName}
//                 onChangeText={setMealName}
//               />

//               <Text style={localStyles.modalLabel}>Date:</Text>
//               <TouchableOpacity
//                 style={localStyles.inputField}
//                 onPress={() => {
//                   setTempDate(new Date(selectedDate));
//                   setShowDatePicker(true);
//                 }}
//               >
//                 <Text>{formatDate(selectedDate)}</Text>
//               </TouchableOpacity>

//               {/* Inline date picker for iOS */}
//               {Platform.OS === 'ios' && showDatePicker && (
//                 <View style={localStyles.pickerContainer}>
//                   <View style={localStyles.pickerHeader}>
//                     <TouchableOpacity onPress={() => setShowDatePicker(false)}>
//                       <Text style={localStyles.pickerCancel}>Cancel</Text>
//                     </TouchableOpacity>
//                     <Text style={localStyles.pickerTitle}>Select Date</Text>
//                     <TouchableOpacity
//                       onPress={() => {
//                         setSelectedDate(tempDate);
//                         setShowDatePicker(false);
//                       }}
//                     >
//                       <Text style={localStyles.pickerDone}>Done</Text>
//                     </TouchableOpacity>
//                   </View>
//                   <DateTimePicker
//                     value={tempDate}
//                     mode="date"
//                     display="spinner"
//                     onChange={handleDateChange}
//                     style={localStyles.picker}
//                   />
//                 </View>
//               )}

//               <Text style={localStyles.modalLabel}>Time:</Text>
//               <TouchableOpacity
//                 style={localStyles.inputField}
//                 onPress={() => {
//                   setTempTime(new Date(selectedTime));
//                   setShowTimePicker(true);
//                 }}
//               >
//                 <Text>{formatTime(selectedTime)}</Text>
//               </TouchableOpacity>

//               {/* Inline time picker for iOS */}
//               {Platform.OS === 'ios' && showTimePicker && (
//                 <View style={localStyles.pickerContainer}>
//                   <View style={localStyles.pickerHeader}>
//                     <TouchableOpacity onPress={() => setShowTimePicker(false)}>
//                       <Text style={localStyles.pickerCancel}>Cancel</Text>
//                     </TouchableOpacity>
//                     <Text style={localStyles.pickerTitle}>Select Time</Text>
//                     <TouchableOpacity
//                       onPress={() => {
//                         setSelectedTime(tempTime);
//                         // Update meal name when time changes
//                         const timeOfDay = getMealType(tempTime.getHours());
//                         const defaultName = `${timeOfDay
//                           .charAt(0)
//                           .toUpperCase()}${timeOfDay.slice(1)} at ${location}`;
//                         setMealName(defaultName);
//                         setShowTimePicker(false);
//                       }}
//                     >
//                       <Text style={localStyles.pickerDone}>Done</Text>
//                     </TouchableOpacity>
//                   </View>
//                   <DateTimePicker
//                     value={tempTime}
//                     mode="time"
//                     display="spinner"
//                     onChange={handleTimeChange}
//                     style={localStyles.picker}
//                   />
//                 </View>
//               )}

//               <Text style={localStyles.modalLabel}>Location:</Text>
//               <View style={localStyles.locationOptionsContainer}>
//                 {LOCATION_OPTIONS.map(renderLocationOption)}
//               </View>

//               <Text style={localStyles.modalLabel}>Notes (optional):</Text>
//               <TextInput
//                 style={[localStyles.textInput, localStyles.textArea]}
//                 placeholder="Add notes about the meal"
//                 value={notes}
//                 onChangeText={setNotes}
//                 multiline={true}
//                 numberOfLines={4}
//               />

//               {selectedFriends.length > 0 && (
//                 <>
//                   <Text style={localStyles.modalLabel}>Selected Friends:</Text>
//                   <View style={localStyles.selectedList}>
//                     {selectedFriends.map((item) => {
//                       const friendData = friends.find((f) => f.id === item.id);
//                       return (
//                         <View
//                           key={item.id}
//                           style={localStyles.selectedItemChip}
//                         >
//                           <Text>{friendData ? friendData.name : item.id}</Text>
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </>
//               )}

//               {selectedSquads.length > 0 && (
//                 <>
//                   <Text style={localStyles.modalLabel}>Selected Squads:</Text>
//                   <View style={localStyles.selectedList}>
//                     {selectedSquads.map((squadId) => {
//                       const squadData = squads.find((s) => s._id === squadId);
//                       return (
//                         <View
//                           key={squadId}
//                           style={localStyles.selectedItemChip}
//                         >
//                           <Text>
//                             {squadData ? squadData.squadName : 'Unknown Squad'}
//                           </Text>
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </>
//               )}
//             </ScrollView>

//             <View style={localStyles.modalButtons}>
//               <Button
//                 mode="outlined"
//                 onPress={() => setShowDetailsModal(false)}
//                 style={localStyles.cancelButton}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 mode="contained"
//                 onPress={scheduleMeal}
//                 style={localStyles.scheduleButton}
//                 loading={loading}
//                 disabled={!mealName}
//               >
//                 Schedule Meal
//               </Button>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const localStyles = StyleSheet.create({
//   contentContainer: {
//     flex: 1,
//     width: '100%',
//     paddingTop: 5,
//   },
//   headerContainer: {
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#000',
//     padding: 10,
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   headerText: {
//     fontSize: 28,
//     fontWeight: '400',
//   },
//   subheaderText: {
//     textAlign: 'center',
//     fontSize: 16,
//     marginBottom: 15,
//     paddingHorizontal: 20,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     marginBottom: 10,
//     paddingHorizontal: 20,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   activeTab: {
//     backgroundColor: '#E8F5D9',
//     borderBottomWidth: 2,
//     borderBottomColor: '#5C4D7D',
//   },
//   tabText: {
//     fontWeight: '500',
//     color: '#555',
//   },
//   activeTabText: {
//     color: '#5C4D7D',
//     fontWeight: 'bold',
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginBottom: 10,
//     width: '100%',
//   },
//   dateTimeButton: {
//     backgroundColor: '#CBDBA7',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     flex: 1,
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   dateTimeText: {
//     fontSize: 16,
//     color: '#000',
//   },
//   sendButton: {
//     backgroundColor: '#E8F5D9',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   sendText: {
//     fontSize: 16,
//     color: '#5C4D7D',
//     marginRight: 5,
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   friendsList: {
//     flex: 1,
//     width: '100%',
//   },
//   friendsListContent: {
//     paddingHorizontal: 0,
//   },
//   friendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#CBDBA7',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   squadItem: {
//     backgroundColor: '#CBDBA7',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   squadHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   squadName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   squadMembersCount: {
//     fontSize: 14,
//     color: '#555',
//     marginTop: 5,
//   },
//   selectedItem: {
//     backgroundColor: '#A4C67D',
//   },
//   avatarContainer: {
//     marginRight: 15,
//   },
//   avatar: {
//     backgroundColor: 'white',
//   },
//   friendInfo: {
//     flex: 1,
//   },
//   friendName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   friendEmail: {
//     fontSize: 14,
//     color: '#555',
//   },
//   bottomButton: {
//     width: '100%',
//     backgroundColor: '#CBDBA7',
//     padding: 10,
//     alignItems: 'flex-end',
//     borderTopWidth: 1,
//     borderTopColor: '#ccc',
//   },
//   scheduleNowButton: {
//     paddingVertical: 5,
//   },
//   scheduleNowText: {
//     fontSize: 16,
//     color: '#5C4D7D',
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     padding: 20,
//     width: '90%',
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   modalScroll: {
//     maxHeight: 400,
//   },
//   modalLabel: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   inputField: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 5,
//     padding: 10,
//     marginBottom: 10,
//   },
//   textInput: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 5,
//     padding: 10,
//     marginBottom: 10,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },
//   cancelButton: {
//     flex: 1,
//     marginRight: 10,
//   },
//   scheduleButton: {
//     flex: 1,
//     marginLeft: 10,
//     backgroundColor: '#5C4D7D',
//   },
//   selectedList: {
//     marginBottom: 10,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   selectedItemChip: {
//     backgroundColor: '#A4C67D',
//     borderRadius: 15,
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     margin: 5,
//   },
//   locationOptionsContainer: {
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 5,
//     padding: 5,
//   },
//   locationOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 5,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   locationOptionText: {
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   emptyText: {
//     textAlign: 'center',
//     padding: 20,
//     fontStyle: 'italic',
//     color: '#666',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#5C4D7D',
//   },
//   // New picker styles for inline date/time selection
//   pickerContainer: {
//     backgroundColor: 'white',
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     marginBottom: 15,
//   },
//   pickerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   pickerTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   pickerCancel: {
//     color: '#5C4D7D',
//     fontSize: 16,
//   },
//   pickerDone: {
//     color: '#5C4D7D',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   picker: {
//     height: 200,
//     width: '100%',
//   },
// });

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  TextInput,
  RadioButton,
  Checkbox,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../styles';
import TopNav from '../components/TopNav';
import useStore from '../store';
import { fetchFriendDetails } from '../services/user-api';

const LOCATION_OPTIONS = ['Foco', 'Collis', 'Novack', 'Fern', 'Hop'];

const getMealType = (hours) => {
  if (hours >= 5 && hours < 11) return 'breakfast';
  if (hours >= 11 && hours < 16) return 'lunch';
  return 'dinner';
};

const formatTimeForApi = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();

  let roundedMinutes = Math.round(minutes / 15) * 15;

  if (roundedMinutes === 60) {
    roundedMinutes = 0;
    hours = (hours + 1) % 24;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = roundedMinutes.toString().padStart(2, '0');

  const timeString = `${formattedHours}:${formattedMinutes}`;

  const generateValidTimes = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 15, 30, 45]) {
        times.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        );
      }
    }
    return times;
  };

  const allPossibleTimes = generateValidTimes();

  if (!allPossibleTimes.includes(timeString)) {
    let closestTime = allPossibleTimes[0];
    let minDifference = Math.abs(
      timeToMinutes(closestTime) - timeToMinutes(timeString),
    );

    for (const validTime of allPossibleTimes) {
      const difference = Math.abs(
        timeToMinutes(validTime) - timeToMinutes(timeString),
      );
      if (difference < minDifference) {
        minDifference = difference;
        closestTime = validTime;
      }
    }

    return closestTime;
  }

  return timeString;
};

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export default function ScheduleMeal({ navigation, route }) {
  const profilePic = route.params?.profilePic || null;
  const [friends, setFriends] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [mealName, setMealName] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const currentUser = useStore((state) => state.userSlice.currentUser);
  const refreshUserProfile = useStore(
    (state) => state.userSlice.refreshUserProfile,
  );
  const userSquads = useStore((state) => state.squadSlice.squads);
  const getUserSquads = useStore((state) => state.squadSlice.getUserSquads);
  const createMeal = useStore((state) => state.mealSlice.createMeal);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUserProfile();
      setShouldRefresh(true);
    });

    return unsubscribe;
  }, [navigation, refreshUserProfile]);

  useEffect(() => {
    if (currentUser?.userID && shouldRefresh) {
      loadData();
    }
  }, [currentUser, shouldRefresh]);

  useEffect(() => {
    const timeOfDay = getMealType(selectedTime.getHours());
    const defaultName = `${timeOfDay.charAt(0).toUpperCase()}${timeOfDay.slice(
      1,
    )} at ${location}`;
    setMealName(defaultName);
  }, [selectedTime, location]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userSquads.length === 0) {
        const fetchedSquads = await getUserSquads(currentUser.userID);
        setSquads(fetchedSquads || []);
      } else {
        setSquads(userSquads);
      }

      if (currentUser?.friendsList && currentUser.friendsList.length > 0) {
        const friendsData = await Promise.all(
          currentUser.friendsList.map(async (friend) => {
            try {
              const details = await fetchFriendDetails(
                currentUser.idToken,
                friend.friendID,
              );

              return {
                id: friend.friendID,
                name: `${details.firstName} ${details.lastName}`,
                email: details.email,
                type: 'friend',
                mongoId: details._id,
                initials: `${details.firstName.charAt(
                  0,
                )}${details.lastName.charAt(0)}`.toUpperCase(),
              };
            } catch (error) {
              return {
                id: friend.friendID,
                name: 'Unknown Friend',
                email: 'Unknown',
                type: 'friend',
                initials: '??',
              };
            }
          }),
        );
        setFriends(friendsData);
      }

      setShouldRefresh(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load friends and squads');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (id, type, mongoId) => {
    setSelectedFriends((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev.filter((item) => item.id !== id);
      }
      return [...prev, { id, type, mongoId }];
    });
  };

  const toggleSquadSelection = (squadId) => {
    setSelectedSquads((prev) => {
      if (prev.includes(squadId)) {
        return prev.filter((id) => id !== squadId);
      }
      return [...prev, squadId];
    });
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        localStyles.friendItem,
        selectedFriends.some((selected) => selected.id === item.id) &&
          localStyles.selectedItem,
      ]}
      onPress={() => toggleFriendSelection(item.id, item.type, item.mongoId)}
    >
      <View style={localStyles.avatarContainer}>
        <Avatar.Text
          size={50}
          label={item.initials}
          style={localStyles.avatar}
        />
      </View>
      <View style={localStyles.friendInfo}>
        <Text style={localStyles.friendName}>{item.name}</Text>
        <Text style={localStyles.friendEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSquadItem = ({ item }) => (
    <TouchableOpacity
      style={[
        localStyles.squadItem,
        selectedSquads.includes(item._id) && localStyles.selectedItem,
      ]}
      onPress={() => toggleSquadSelection(item._id)}
    >
      <View style={localStyles.squadHeader}>
        <Text style={localStyles.squadName}>{item.squadName}</Text>
        <Checkbox
          status={selectedSquads.includes(item._id) ? 'checked' : 'unchecked'}
          onPress={() => toggleSquadSelection(item._id)}
          color="#5C4D7D"
        />
      </View>
      <Text style={localStyles.squadMembersCount}>
        {item.members.length} members
      </Text>
    </TouchableOpacity>
  );

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date) {
        setSelectedDate(date);
      }
    } else {
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (time) {
        setSelectedTime(time);
        const timeOfDay = getMealType(time.getHours());
        const defaultName = `${timeOfDay
          .charAt(0)
          .toUpperCase()}${timeOfDay.slice(1)} at ${location}`;
        setMealName(defaultName);
      }
    } else {
      if (time) {
        setTempTime(time);
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const showMealDetails = () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }
    setShowDetailsModal(true);
  };

  const scheduleMeal = async () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }

    if (!mealName) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    try {
      setLoading(true);

      const participants = selectedFriends.map((item) => ({
        userID: item.mongoId,
        status: 'invited',
      }));

      const date = new Date(selectedDate);
      date.setHours(selectedTime.getHours());
      date.setMinutes(selectedTime.getMinutes());

      const mealType = getMealType(selectedTime.getHours());
      const timeString = formatTimeForApi(selectedTime);

      const mealData = {
        mealName: mealName,
        host: currentUser._id,
        date: date,
        time: timeString,
        location: location,
        notes: notes,
        participants: participants,
        squadIds: selectedSquads,
        mealType: mealType,
      };

      const result = await createMeal(mealData);

      setShowDetailsModal(false);
      setSelectedFriends([]);
      setSelectedSquads([]);
      setLocation(LOCATION_OPTIONS[0]);
      setNotes('');

      Alert.alert('Success', `Meal "${mealName}" scheduled successfully`, [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('ViewMeals', {
              profilePic,
              reloadMeals: true,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to schedule meal: ' + (error.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  const scheduleNow = () => {
    if (selectedFriends.length === 0 && selectedSquads.length === 0) {
      Alert.alert('Error', 'Please select at least one friend or squad');
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setSelectedDate(now);
    setSelectedTime(now);
    setShowDetailsModal(true);
  };

  const renderLocationOption = (locationName) => (
    <TouchableOpacity
      key={locationName}
      style={localStyles.locationOption}
      onPress={() => {
        setLocation(locationName);
        const timeOfDay = getMealType(selectedTime.getHours());
        const defaultName = `${timeOfDay
          .charAt(0)
          .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
        setMealName(defaultName);
      }}
    >
      <RadioButton
        value={locationName}
        status={location === locationName ? 'checked' : 'unchecked'}
        onPress={() => {
          setLocation(locationName);
          const timeOfDay = getMealType(selectedTime.getHours());
          const defaultName = `${timeOfDay
            .charAt(0)
            .toUpperCase()}${timeOfDay.slice(1)} at ${locationName}`;
          setMealName(defaultName);
        }}
        color="#5C4D7D"
      />
      <Text style={localStyles.locationOptionText}>{locationName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav
          navigation={navigation}
          title="Schedule Meal"
          profilePic={profilePic}
        />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color="#5C4D7D" />
          <Text style={{ marginTop: 20 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        navigation={navigation}
        title="Schedule Meal"
        profilePic={profilePic}
      />
      <View style={{ height: 50 }} />

      <View style={localStyles.contentContainer}>
        <View style={localStyles.headerContainer}>
          <Text style={localStyles.headerText}>MEAL</Text>
        </View>

        <Text style={localStyles.subheaderText}>
          Select friends or squads to schedule a meal with.
        </Text>

        <View style={localStyles.tabContainer}>
          <TouchableOpacity
            style={[
              localStyles.tab,
              activeTab === 'friends' && localStyles.activeTab,
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                localStyles.tabText,
                activeTab === 'friends' && localStyles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              localStyles.tab,
              activeTab === 'squads' && localStyles.activeTab,
            ]}
            onPress={() => setActiveTab('squads')}
          >
            <Text
              style={[
                localStyles.tabText,
                activeTab === 'squads' && localStyles.activeTabText,
              ]}
            >
              Squads
            </Text>
          </TouchableOpacity>
        </View>

        <View style={localStyles.actionButtonsContainer}>
          <TouchableOpacity
            style={localStyles.dateTimeButton}
            onPress={showMealDetails}
          >
            <Text style={localStyles.dateTimeText}>Date/Time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.sendButton,
              selectedFriends.length === 0 &&
                selectedSquads.length === 0 &&
                localStyles.disabledButton,
            ]}
            disabled={
              selectedFriends.length === 0 && selectedSquads.length === 0
            }
            onPress={showMealDetails}
          >
            <Text style={localStyles.sendText}>Send</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#5C4D7D"
            />
          </TouchableOpacity>
        </View>

        <View style={localStyles.listContainer}>
          {activeTab === 'friends' ? (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              style={localStyles.friendsList}
              contentContainerStyle={localStyles.friendsListContent}
              ListEmptyComponent={
                <Text style={localStyles.emptyText}>
                  No friends found. Add friends to schedule meals with them.
                </Text>
              }
            />
          ) : (
            <FlatList
              data={squads}
              renderItem={renderSquadItem}
              keyExtractor={(item) => item._id}
              style={localStyles.friendsList}
              contentContainerStyle={localStyles.friendsListContent}
              ListEmptyComponent={
                <Text style={localStyles.emptyText}>
                  No squads found. Create a squad to schedule group meals.
                </Text>
              }
            />
          )}
        </View>
      </View>

      <View style={localStyles.bottomButton}>
        <TouchableOpacity
          style={[
            localStyles.scheduleNowButton,
            selectedFriends.length === 0 &&
              selectedSquads.length === 0 &&
              localStyles.disabledButton,
          ]}
          onPress={scheduleNow}
          disabled={selectedFriends.length === 0 && selectedSquads.length === 0}
        >
          <Text style={localStyles.scheduleNowText}>Schedule Meal Now</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Schedule Meal</Text>

            <ScrollView style={localStyles.modalScroll}>
              <Text style={localStyles.modalLabel}>Meal Name:</Text>
              <TextInput
                style={localStyles.textInput}
                placeholder="Give your meal a name"
                value={mealName}
                onChangeText={setMealName}
              />

              <Text style={localStyles.modalLabel}>Date:</Text>
              <TouchableOpacity
                style={localStyles.inputField}
                onPress={() => {
                  setTempDate(new Date(selectedDate));
                  setShowDatePicker(true);
                }}
              >
                <Text>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showDatePicker && (
                <View style={localStyles.pickerContainer}>
                  <View style={localStyles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={localStyles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.pickerTitle}>Select Date</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDate(tempDate);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={localStyles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    style={localStyles.picker}
                  />
                </View>
              )}

              <Text style={localStyles.modalLabel}>Time:</Text>
              <TouchableOpacity
                style={localStyles.inputField}
                onPress={() => {
                  setTempTime(new Date(selectedTime));
                  setShowTimePicker(true);
                }}
              >
                <Text>{formatTime(selectedTime)}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showTimePicker && (
                <View style={localStyles.pickerContainer}>
                  <View style={localStyles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={localStyles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.pickerTitle}>Select Time</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTime(tempTime);
                        const timeOfDay = getMealType(tempTime.getHours());
                        const defaultName = `${timeOfDay
                          .charAt(0)
                          .toUpperCase()}${timeOfDay.slice(1)} at ${location}`;
                        setMealName(defaultName);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={localStyles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={localStyles.picker}
                  />
                </View>
              )}

              <Text style={localStyles.modalLabel}>Location:</Text>
              <View style={localStyles.locationOptionsContainer}>
                {LOCATION_OPTIONS.map(renderLocationOption)}
              </View>

              <Text style={localStyles.modalLabel}>Notes (optional):</Text>
              <TextInput
                style={[localStyles.textInput, localStyles.textArea]}
                placeholder="Add notes about the meal"
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={4}
              />

              {selectedFriends.length > 0 && (
                <>
                  <Text style={localStyles.modalLabel}>Selected Friends:</Text>
                  <View style={localStyles.selectedList}>
                    {selectedFriends.map((item) => {
                      const friendData = friends.find((f) => f.id === item.id);
                      return (
                        <View
                          key={item.id}
                          style={localStyles.selectedItemChip}
                        >
                          <Text>{friendData ? friendData.name : item.id}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {selectedSquads.length > 0 && (
                <>
                  <Text style={localStyles.modalLabel}>Selected Squads:</Text>
                  <View style={localStyles.selectedList}>
                    {selectedSquads.map((squadId) => {
                      const squadData = squads.find((s) => s._id === squadId);
                      return (
                        <View
                          key={squadId}
                          style={localStyles.selectedItemChip}
                        >
                          <Text>
                            {squadData ? squadData.squadName : 'Unknown Squad'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={localStyles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDetailsModal(false)}
                style={localStyles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={scheduleMeal}
                style={localStyles.scheduleButton}
                loading={loading}
                disabled={!mealName}
              >
                Schedule Meal
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 5,
  },
  headerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    alignItems: 'center',
    marginBottom: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '400',
  },
  subheaderText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#E8F5D9',
    borderBottomWidth: 2,
    borderBottomColor: '#5C4D7D',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#5C4D7D',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
  },
  dateTimeButton: {
    backgroundColor: '#CBDBA7',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#E8F5D9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 16,
    color: '#5C4D7D',
    marginRight: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  friendsList: {
    flex: 1,
    width: '100%',
  },
  friendsListContent: {
    paddingHorizontal: 0,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBDBA7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  squadItem: {
    backgroundColor: '#CBDBA7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  squadMembersCount: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  selectedItem: {
    backgroundColor: '#A4C67D',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    backgroundColor: 'white',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
    color: '#555',
  },
  bottomButton: {
    width: '100%',
    backgroundColor: '#CBDBA7',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  scheduleNowButton: {
    paddingVertical: 5,
  },
  scheduleNowText: {
    fontSize: 16,
    color: '#5C4D7D',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  scheduleButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#5C4D7D',
  },
  selectedList: {
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedItemChip: {
    backgroundColor: '#A4C67D',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  locationOptionsContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationOptionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#5C4D7D',
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
  listContainer: {
    flex: 1,
    width: '100%',
  },
});

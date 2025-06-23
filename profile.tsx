// profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../FirebaseConfig'; // Import Firebase auth
import { onAuthStateChanged } from 'firebase/auth'; // Import auth state listener
import Logo from "../assets/images/logo.jpeg";

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('User');
  const [userEmail, setUserEmail] = useState(''); // Add email state
  const [userStats, setUserStats] = useState({
    favoriteWords: 0,
    totalWordsViewed: 0,
    dailyStreak: 0,
    joinDate: null,
  });
  const [settings, setSettings] = useState({
    dailyReminders: true,
    darkMode: true,
    soundEffects: false,
  });

  // Load user data and stats
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Listen for auth state changes and get user info from Firebase
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is signed in, get their display name (username)
          const displayName = user.displayName || 'User';
          const email = user.email || '';
          
          setUsername(displayName);
          setUserEmail(email);
          
          // Load favorites count
          const savedFavorites = await AsyncStorage.getItem('favoriteWords');
          const favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
          
          // Load or initialize user stats
          const savedStats = await AsyncStorage.getItem('userStats');
          let stats;
          if (savedStats) {
            stats = JSON.parse(savedStats);
          } else {
            // Initialize stats for new user - use Firebase user creation date if available
            const joinDate = user.metadata.creationTime || new Date().toISOString();
            stats = {
              favoriteWords: favorites.length,
              totalWordsViewed: 0,
              dailyStreak: 1,
              joinDate: joinDate,
              lastActiveDate: new Date().toISOString(),
            };
            await AsyncStorage.setItem('userStats', JSON.stringify(stats));
          }
          
          // Update favorites count
          stats.favoriteWords = favorites.length;
          
          // Load settings
          const savedSettings = await AsyncStorage.getItem('userSettings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
          
          setUserStats(stats);
          
        } else {
          // User is signed out, redirect to login
          router.replace('/');
        }
        setLoading(false);
      });

      // Clean up subscription
      return unsubscribe;
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Update user stats
  const updateStats = async (updates) => {
    try {
      const currentStats = { ...userStats, ...updates };
      await AsyncStorage.setItem('userStats', JSON.stringify(currentStats));
      setUserStats(currentStats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = loadUserData();
    
    // Clean up auth listener on component unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              // The onAuthStateChanged listener will handle the redirect
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Keep favorites but reset other stats
              const resetStats = {
                favoriteWords: userStats.favoriteWords,
                totalWordsViewed: 0,
                dailyStreak: 1,
                joinDate: userStats.joinDate,
                lastActiveDate: new Date().toISOString(),
              };
              await AsyncStorage.setItem('userStats', JSON.stringify(resetStats));
              setUserStats(resetStats);
              Alert.alert('Success', 'Your progress has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset progress.');
            }
          },
        },
      ]
    );
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all favorite words? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('favoriteWords', JSON.stringify([]));
              await updateStats({ favoriteWords: 0 });
              Alert.alert('Success', 'All favorites have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear favorites.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateDaysActive = () => {
    if (!userStats.joinDate) return 0;
    const joinDate = new Date(userStats.joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarContainer}>
                <Image source={Logo} style={styles.avatar} />
              </View>
              <Text style={styles.userName}>{username}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <Text style={styles.userJoinDate}>
                Member since {formatDate(userStats.joinDate)}
              </Text>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{userStats.favoriteWords}</Text>
                  <Text style={styles.statLabel}>Favorite Words</Text>
                  <Text style={styles.statIcon}>❤️</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{userStats.totalWordsViewed}</Text>
                  <Text style={styles.statLabel}>Words Viewed</Text>
                  <Text style={styles.statIcon}>👁️</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{userStats.dailyStreak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                  <Text style={styles.statIcon}>🔥</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{calculateDaysActive()}</Text>
                  <Text style={styles.statLabel}>Days Active</Text>
                  <Text style={styles.statIcon}>📅</Text>
                </View>
              </View>
            </View>

            {/* Settings */}
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Daily Reminders</Text>
                    <Text style={styles.settingDescription}>
                      Get notified to practice vocabulary daily
                    </Text>
                  </View>
                  <Switch
                    value={settings.dailyReminders}
                    onValueChange={(value) => saveSettings({...settings, dailyReminders: value})}
                    trackColor={{ false: "#333333", true: "#4CAF50" }}
                    thumbColor={settings.dailyReminders ? "#ffffff" : "#888888"}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Sound Effects</Text>
                    <Text style={styles.settingDescription}>
                      Play sounds for interactions and feedback
                    </Text>
                  </View>
                  <Switch
                    value={settings.soundEffects}
                    onValueChange={(value) => saveSettings({...settings, soundEffects: value})}
                    trackColor={{ false: "#333333", true: "#4CAF50" }}
                    thumbColor={settings.soundEffects ? "#ffffff" : "#888888"}
                  />
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/favorites')}
              >
                <Text style={styles.actionIcon}>❤️</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>View Favorites</Text>
                  <Text style={styles.actionDescription}>
                    Review your {userStats.favoriteWords} favorite words
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.back()}
              >
                <Text style={styles.actionIcon}>📚</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Continue Learning</Text>
                  <Text style={styles.actionDescription}>
                    Back to vocabulary practice
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerContainer}>
              <Text style={styles.sectionTitle}>Data Management</Text>
              
              <TouchableOpacity 
                style={styles.dangerButton}
                onPress={handleClearFavorites}
              >
                <Text style={styles.dangerIcon}>💔</Text>
                <View style={styles.dangerContent}>
                  <Text style={styles.dangerTitle}>Clear All Favorites</Text>
                  <Text style={styles.dangerDescription}>
                    Remove all words from favorites
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dangerButton}
                onPress={handleResetProgress}
              >
                <Text style={styles.dangerIcon}>🔄</Text>
                <View style={styles.dangerContent}>
                  <Text style={styles.dangerTitle}>Reset Progress</Text>
                  <Text style={styles.dangerDescription}>
                    Reset viewing stats and streak
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Vocabulary App v1.0.0</Text>
              <Text style={styles.infoText}>Made with ❤️ for learning</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOutButtonText: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#333333',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
  },
  userEmail: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  userJoinDate: {
    color: '#888888',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    width: (width - 55) / 2,
  },
  statNumber: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 5,
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 5,
  },
  statIcon: {
    fontSize: 20,
  },
  settingsContainer: {
    marginBottom: 30,
  },
  settingCard: {
    backgroundColor: '#111111',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  settingDescription: {
    color: '#888888',
    fontSize: 14,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  actionDescription: {
    color: '#888888',
    fontSize: 14,
  },
  actionArrow: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
  },
  dangerContainer: {
    marginBottom: 30,
  },
  dangerButton: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  dangerIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  dangerContent: {
    flex: 1,
  },
  dangerTitle: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  dangerDescription: {
    color: '#888888',
    fontSize: 14,
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoText: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 3,
  },
});
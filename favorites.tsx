// favorites.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from "../assets/images/logo.jpeg";

const { width, height } = Dimensions.get('window');

export default function FavoritesScreen() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [favoriteWords, setFavoriteWords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const savedFavorites = await AsyncStorage.getItem('favoriteWords');
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        setFavoriteWords(favorites);
        if (favorites.length === 0) {
          setCurrentWordIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorite words');
    } finally {
      setLoading(false);
    }
  };

  // Save favorites to AsyncStorage
  const saveFavorites = async (favorites) => {
    try {
      await AsyncStorage.setItem('favoriteWords', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Focus listener to refresh favorites when screen comes into focus
  useEffect(() => {
    const unsubscribe = router.events?.on('focus', loadFavorites) || (() => {});
    loadFavorites();
    
    return unsubscribe;
  }, []);

  const handleNextWord = () => {
    if (favoriteWords.length === 0) return;
    
    setCurrentWordIndex((prev) => (prev + 1) % favoriteWords.length);
    
    // Reset and replay card animation
    cardScaleAnim.setValue(0.95);
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handlePreviousWord = () => {
    if (favoriteWords.length === 0) return;
    
    setCurrentWordIndex((prev) => prev === 0 ? favoriteWords.length - 1 : prev - 1);
    
    // Reset and replay card animation
    cardScaleAnim.setValue(0.95);
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleRemoveFromFavorites = async () => {
    if (favoriteWords.length === 0) return;
    
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this word from your favorites?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const currentWord = favoriteWords[currentWordIndex];
            const newFavorites = favoriteWords.filter(word => word.id !== currentWord.id);
            
            setFavoriteWords(newFavorites);
            await saveFavorites(newFavorites);
            
            // Adjust current index if necessary
            if (newFavorites.length === 0) {
              setCurrentWordIndex(0);
            } else if (currentWordIndex >= newFavorites.length) {
              setCurrentWordIndex(newFavorites.length - 1);
            }
          },
        },
      ]
    );
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleWordsPress = () => {
    router.back();
  };

  const getWordType = (word) => {
    // Determine word type based on available data
    if (word.adjective && word.adjective !== word.word) {
      return 'verb';
    } else if (word.noun) {
      return 'noun';
    }
    return 'word';
  };

  const getVerbMeaning = (word) => {
    // Extract verb meaning from example or create one
    if (word.example) {
      const sentences = word.example.split('.');
      return sentences[0] || 'To perform an action or express a state of being';
    }
    return 'To perform an action related to ' + word.word.toLowerCase();
  };

  const getSynonyms = (word) => {
    // Return synonyms if available, otherwise create some based on context
    if (word.synonyms && word.synonyms.length > 0) {
      return word.synonyms;
    }
    // Return empty array if no synonyms available
    return [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (favoriteWords.length === 0) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.logoContainer}>
                <Image source={Logo} style={styles.logo} />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Favorites</Text>
              </View>

              <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>
            </View>

            {/* Empty State */}
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>💔</Text>
              <Text style={styles.emptyStateTitle}>No Favorite Words Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Start adding words to your favorites by tapping the heart icon while browsing vocabulary.
              </Text>
              <TouchableOpacity style={styles.browseButton} onPress={() => router.back()}>
                <Text style={styles.browseButtonText}>Browse Words</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
              <TouchableOpacity style={styles.tabButton} onPress={handleWordsPress}>
                <Text style={styles.tabIcon}>📚</Text>
                <Text style={styles.tabLabel}>Words</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
                <Text style={[styles.tabIcon, styles.tabIconActive]}>❤️</Text>
                <Text style={[styles.tabLabel, styles.tabLabelActive]}>
                  Favorites (0)
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </>
    );
  }

  const currentWord = favoriteWords[currentWordIndex];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Logo and Profile */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {currentWordIndex + 1} / {favoriteWords.length} (Favorites)
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${((currentWordIndex + 1) / favoriteWords.length) * 100}%` }]} />
              </View>
            </View>

            <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content - Scrollable */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.wordCard,
                {
                  transform: [{ scale: cardScaleAnim }]
                }
              ]}
            >
              {/* Main Word */}
              <View style={styles.wordSection}>
                <Text style={styles.mainWord}>{currentWord.word}</Text>
                <View style={styles.favoriteIndicator}>
                  <Text style={styles.favoriteIndicatorIcon}>❤️</Text>
                  <Text style={styles.favoriteIndicatorText}>Favorite Word</Text>
                </View>
              </View>

              {/* Adjective */}
              {currentWord.adjective && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Adjective</Text>
                  <Text style={styles.sectionContent}>{currentWord.adjective}</Text>
                </View>
              )}

              {/* Verb Meaning */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Verb Meaning</Text>
                <Text style={styles.sectionContent}>{getVerbMeaning(currentWord)}</Text>
              </View>

              {/* Example */}
              {currentWord.example && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Example</Text>
                  <Text style={styles.exampleText}>"{currentWord.example}"</Text>
                </View>
              )}

              {/* Synonyms */}
              {getSynonyms(currentWord).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Synonyms</Text>
                  <View style={styles.synonymsContainer}>
                    {getSynonyms(currentWord).map((synonym, index) => (
                      <Text key={index} style={styles.synonymTag}>{synonym}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Word Forms */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Word Forms</Text>
                <View style={styles.wordFormsContainer}>
                  {currentWord.noun && (
                    <Text style={styles.wordFormText}>Noun: {currentWord.noun}</Text>
                  )}
                  {currentWord.adjective && (
                    <Text style={styles.wordFormText}>Adjective: {currentWord.adjective}</Text>
                  )}
                  <Text style={styles.wordFormText}>
                    {getWordType(currentWord)}: {currentWord.word}
                  </Text>
                </View>
              </View>

              {/* Remove from Favorites Button */}
              <View style={styles.favoriteSection}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={handleRemoveFromFavorites}
                >
                  <Text style={styles.removeIcon}>💔</Text>
                  <Text style={styles.removeText}>Remove from Favorites</Text>
                </TouchableOpacity>
              </View>

              {/* Navigation Buttons */}
              <View style={styles.navigationButtons}>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={handlePreviousWord}
                >
                  <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton]}
                  onPress={handleNextWord}
                >
                  <Text style={[styles.navButtonText, styles.nextButtonText]}>Next →</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Bottom Tab - Navigation */}
          <View style={styles.bottomTab}>
            <TouchableOpacity style={styles.tabButton} onPress={() => router.back()}>
              <Text style={styles.tabIcon}>📚</Text>
              <Text style={styles.tabLabel}>Words</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
              <Text style={[styles.tabIcon, styles.tabIconActive]}>❤️</Text>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>
                Favorites ({favoriteWords.length})
              </Text>
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff4757',
    borderRadius: 2,
  },
  profileContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  wordCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainWord: {
    fontSize: 42,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 15,
  },
  favoriteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  favoriteIndicatorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  favoriteIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ff4757',
  },
  removeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  removeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4757',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 16,
    color: '#ffffff',
    fontStyle: 'italic',
    lineHeight: 24,
    paddingLeft: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4757',
  },
  synonymsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  synonymTag: {
    backgroundColor: '#333333',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 14,
  },
  wordFormsContainer: {
    gap: 8,
  },
  wordFormText: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#ff4757',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#000000',
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateDescription: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomTab: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#111111',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#222222',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
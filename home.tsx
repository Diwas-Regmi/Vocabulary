// home.tsx
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
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, startAfter, orderBy } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from "../assets/images/logo.jpeg";

const { width, height } = Dimensions.get('window');

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDmg5WYVVsC6fTQcdvNDjXMN9sc7xzYYwU",
  authDomain: "vocabulary-38f8f.firebaseapp.com",
  projectId: "vocabulary-38f8f",
  storageBucket: "vocabulary-38f8f.firebasestorage.app",
  messagingSenderId: "88893388155",
  appId: "1:88893388155:web:7b4f5a06f00f76bfddf9de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function HomeScreen() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [vocabularyData, setVocabularyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoriteWords, setFavoriteWords] = useState([]);

  // Animations
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favoriteWords');
      if (savedFavorites) {
        setFavoriteWords(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
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

  // Fetch vocabulary data from Firebase
  const fetchVocabularyData = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let q;
      if (isInitial || !lastDoc) {
        q = query(
          collection(db, 'vocabulary'),
          orderBy('word'),
          limit(20)
        );
      } else {
        q = query(
          collection(db, 'vocabulary'),
          orderBy('word'),
          startAfter(lastDoc),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const words = [];
      
      querySnapshot.forEach((doc) => {
        words.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (isInitial) {
        setVocabularyData(words);
      } else {
        setVocabularyData(prev => [...prev, ...words]);
      }

      // Set last document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      Alert.alert('Error', 'Failed to load vocabulary data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVocabularyData();
    loadFavorites();
  }, []);

  const handleNextWord = () => {
    // Check if we're near the end and need to load more
    if (currentWordIndex >= vocabularyData.length - 5) {
      fetchVocabularyData(false);
    }
    
    setCurrentWordIndex((prev) => (prev + 1) % vocabularyData.length);
  };

  const handlePreviousWord = () => {
    setCurrentWordIndex((prev) => prev === 0 ? vocabularyData.length - 1 : prev - 1);
  };

  const handleToggleFavorite = async () => {
    const currentWord = vocabularyData[currentWordIndex];
    
    if (!currentWord) return;
    
    const isAlreadyFavorited = favoriteWords.some(word => word.id === currentWord.id);
    
    let newFavorites;
    if (isAlreadyFavorited) {
      // Remove from favorites
      newFavorites = favoriteWords.filter(word => word.id !== currentWord.id);
    } else {
      // Add to favorites
      newFavorites = [...favoriteWords, currentWord];
    }
    
    setFavoriteWords(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isCurrentWordFavorited = () => {
    const currentWord = vocabularyData[currentWordIndex];
    return currentWord ? favoriteWords.some(word => word.id === currentWord.id) : false;
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleFavoritesPress = () => {
    router.push('/favorites');
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
        <Text style={styles.loadingText}>Loading vocabulary...</Text>
      </View>
    );
  }

  if (!vocabularyData.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No vocabulary data available</Text>
      </View>
    );
  }

  const currentWord = vocabularyData[currentWordIndex];

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
            
            <View style={styles.headerCenterContainer}>
              <Text style={styles.appTitle}>Vocabulary</Text>
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

              {/* Favorite Button */}
              <View style={styles.favoriteSection}>
                <TouchableOpacity 
                  style={[styles.favoriteButton, isCurrentWordFavorited() && styles.favoriteButtonActive]}
                  onPress={handleToggleFavorite}
                >
                  <Text style={[styles.favoriteIcon, isCurrentWordFavorited() && styles.favoriteIconActive]}>
                    {isCurrentWordFavorited() ? '❤️' : '🤍'}
                  </Text>
                  <Text style={[styles.favoriteText, isCurrentWordFavorited() && styles.favoriteTextActive]}>
                    {isCurrentWordFavorited() ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Text>
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

            {/* Loading indicator for pagination */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loadingMoreText}>Loading more words...</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Tab - Navigation */}
          <View style={styles.bottomTab}>
            <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
              <Text style={[styles.tabIcon, styles.tabIconActive]}>📚</Text>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Words</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.tabButton}
              onPress={handleFavoritesPress}
            >
              <Text style={styles.tabIcon}>❤️</Text>
              <Text style={styles.tabLabel}>
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
    paddingVertical: 20,
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
  headerCenterContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  },
  favoriteSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#333333',
  },
  favoriteButtonActive: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  favoriteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  favoriteIconActive: {
    fontSize: 20,
  },
  favoriteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
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
    borderLeftColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#000000',
  },
  loadingMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
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
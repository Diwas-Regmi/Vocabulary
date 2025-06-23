// signup.tsx
import { auth, db } from '../FirebaseConfig' // Add db import
import React, { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore' // Add Firestore imports

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import Logo from "../assets/images/logo.jpeg";

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Only keep button animation for press feedback
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleSignup = async () => {
    // Validation
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert("Missing Information", "Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Password Mismatch", "Passwords don't match");
      return;
    }

    if (password.length < 6) {
      showAlert("Weak Password", "Password must be at least 6 characters long");
      return;
    }

    // Username validation
    if (username.length < 3) {
      showAlert("Invalid Username", "Username must be at least 3 characters long");
      return;
    }

    setIsLoading(true);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name (username)
      await updateProfile(user, {
        displayName: username,
      });

      // Store user data in Firestore
      const userData = {
        uid: user.uid,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        displayName: username.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add any additional user fields you want to store
        profileComplete: false,
        vocabProgress: {
          totalWords: 0,
          masteredWords: 0,
          streak: 0,
        }
      };

      // Save to Firestore using the user's UID as the document ID
      await setDoc(doc(db, 'users', user.uid), userData);

      console.log('User created successfully:', user.email);
      console.log('Username set to:', username);
      console.log('User data stored in Firestore');

      // Navigate to login screen with success parameter
      router.replace("/?success=1");

    } catch (error) {
      console.error('Signup error:', error);

      // Handle different Firebase auth errors
      let errorMessage = "An error occurred during account creation";

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later";
          break;
        // Firestore specific errors
        case 'permission-denied':
          errorMessage = "Permission denied. Please check your Firestore rules";
          break;
        case 'unavailable':
          errorMessage = "Service temporarily unavailable. Please try again";
          break;
        default:
          errorMessage = error.message || "Account creation failed. Please try again";
      }

      showAlert("Signup Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image source={Logo} style={styles.logo} />
                </View>
                
                <Text style={styles.appName}>
                  Join <Text style={styles.appNameHighlight}>V</Text>ocabulary
                </Text>
                <Text style={styles.subtitle}>
                  Start your journey to expand your vocabulary today.
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={[
                    styles.inputWrapper, 
                    usernameFocused && styles.inputWrapperFocused
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Choose a username"
                      placeholderTextColor="#888888"
                      value={username}
                      onChangeText={setUsername}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => setUsernameFocused(false)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper, 
                    emailFocused && styles.inputWrapperFocused
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#888888"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper, 
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#888888"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper, 
                    confirmPasswordFocused && styles.inputWrapperFocused
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#888888"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleSignup}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity 
                  style={styles.linkContainer}
                  onPress={() => router.push("/")}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>

                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 20,
  },
  header: {
    flex: 0.35,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: "300",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  appNameHighlight: {
    color: '#4CAF50',
    fontSize: 36,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 15,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    maxWidth: width * 0.85,
  },
  formContainer: {
    flex: 0.65,
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 10,
  },
  inputWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#4CAF50',
  },
  input: {
    height: 54,
    borderColor: "#333333",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 18,
    fontSize: 15,
    backgroundColor: "#111111",
    color: "#ffffff",
  },
  button: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 28,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 20,
  },
  linkText: {
    color: "#888888",
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  termsContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  termsText: {
    color: "#666666",
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: "#4CAF50",
    fontWeight: "600",
  },
});
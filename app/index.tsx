// index.tsx
import { auth } from '../FirebaseConfig'
import React, { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword } from 'firebase/auth'

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
import { useRouter, useLocalSearchParams } from "expo-router";
import Logo from "../assets/images/logo.jpeg";

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Only keep button animation for press feedback
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Missing Information", "Please fill in both email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address");
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
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User logged in successfully:', user.email);
      
      // Navigate to home screen on successful login
      router.replace("/home");
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different Firebase auth errors
      let errorMessage = "An error occurred during login";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection";
          break;
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password";
          break;
        default:
          errorMessage = error.message || "Login failed. Please try again";
      }
      
      showAlert("Login Failed", errorMessage);
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
                  <Text style={styles.appNameHighlight}>V</Text>ocabulary
                </Text>
                <Text style={styles.subtitle}>
                  One word a day, a thousand doors your way.
                </Text>
              </View>

              <View style={styles.formContainer}>
                {params.success === "1" && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successMessage}>
                      ✨ Account created successfully! Welcome aboard.
                    </Text>
                  </View>
                )}

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
                      placeholder="Enter your password"
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

                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity 
                  style={styles.linkContainer}
                  onPress={() => router.push("/signup")}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>
                    Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
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
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 30,
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
    fontSize: 42,
    fontWeight: "300",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  appNameHighlight: {
    color: '#4CAF50',
    fontSize: 42,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
    maxWidth: width * 0.8,
  },
  formContainer: {
    flex: 0.55,
    paddingTop: 20,
    paddingBottom: 40,
  },
  successContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 15, 
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333333',
  },
  successMessage: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 25,
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
    fontSize: 16,
    backgroundColor: "#111111",
    color: "#ffffff",
  },
  button: {
    height: 54,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  linkText: {
    color: "#888888",
    fontSize: 16,
    textAlign: 'center',
  },
  linkTextBold: {
    color: "#4CAF50",
    fontWeight: "600",
  },
});
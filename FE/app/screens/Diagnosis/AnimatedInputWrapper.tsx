import React, { useRef, useImperativeHandle, useEffect } from "react";
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onAnimationEnd?: () => void;
  width?: DimensionValue;
  height?: DimensionValue;
}

const AnimatedInputWrapper = React.forwardRef<
  { triggerAnimation: () => Promise<void> },
  Props
>(({ children, style, onAnimationEnd, width = "100%", height = 60 }, ref) => {
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  const triggerAnimation = (): Promise<void> => {
    return new Promise((resolve) => {
      // Reset animation state
      hasAnimated.current = false;
      shimmerTranslate.setValue(-50);
      trailOpacity.setValue(0);
      glowOpacity.setValue(0);

      // Enhanced shimmer animation sequence with glow effect
      Animated.parallel([
        // Main shimmer movement from left to right (matching FollowUpQuestions)
        Animated.timing(shimmerTranslate, {
          toValue: SCREEN_WIDTH + 50,
          duration: 2000,
          useNativeDriver: true,
        }),
        // Trail opacity that builds up and stays
        Animated.timing(trailOpacity, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        // Glow effect that pulses during animation (matching FollowUpQuestions)
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        // Animation completed - ensure trail stays visible
        if (onAnimationEnd) {
          onAnimationEnd();
        }
        resolve();
      });
    });
  };

  useImperativeHandle(ref, () => ({
    triggerAnimation,
  }));

  const trailInterpolation = trailOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)"],
    extrapolate: "clamp", // Prevent flickering by clamping values
  });

  const glowInterpolation = glowOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(59, 130, 246, 0)", "rgba(59, 130, 246, 0.3)"],
    extrapolate: "clamp",
  });

  // Continuous pulse animation (like FollowUpQuestions)
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Start continuous pulse animation (like FollowUpQuestions)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={[
        {
          position: "relative",
          overflow: "hidden",
          width,
          height,
          borderRadius: 12,
        },
        style,
      ]}
    >
      {/* Inner container to ensure effects are contained */}
      <View
        style={{
          position: "relative",
          flex: 1,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {children}

        {/* Continuous pulse effect (like FollowUpQuestions) */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#2563eb", // match blue border color
            opacity: pulseOpacity,
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <LinearGradient
            colors={["transparent", "rgba(59, 130, 246, 0.3)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              borderRadius: 12,
            }}
          />
        </Animated.View>

        {/* Persistent white trail that remains after shimmer */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: trailInterpolation,
              borderRadius: 12,
              overflow: "hidden",
            },
          ]}
        />

        {/* Glow effect during animation */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glowInterpolation,
              borderRadius: 12,
              overflow: "hidden",
            },
          ]}
        />

        {/* Moving shimmer line */}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            transform: [{ translateX: shimmerTranslate }],
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["transparent", "rgba(59, 130, 246, 0.3)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: 120,
              height: "100%",
              borderRadius: 12,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
});

export default AnimatedInputWrapper;

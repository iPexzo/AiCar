import React, { useRef, useImperativeHandle } from "react";
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onAnimationEnd?: () => void;
}

const AnimatedInputWrapper = React.forwardRef<
  { triggerAnimation: () => Promise<void> },
  Props
>(({ children, style, onAnimationEnd }, ref) => {
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  const triggerAnimation = (): Promise<void> => {
    return new Promise((resolve) => {
      // Prevent multiple animations
      if (hasAnimated.current) {
        resolve();
        return;
      }

      hasAnimated.current = true;
      shimmerTranslate.setValue(-SCREEN_WIDTH);
      trailOpacity.setValue(0);

      // Single shimmer animation sequence
      Animated.parallel([
        // Main shimmer movement from left to right
        Animated.timing(shimmerTranslate, {
          toValue: SCREEN_WIDTH,
          duration: 1600,
          useNativeDriver: true,
        }),
        // Trail opacity that builds up and stays
        Animated.timing(trailOpacity, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: false,
        }),
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

  return (
    <View style={[{ position: "relative", overflow: "hidden" }, style]}>
      {children}

      {/* Persistent white trail that remains after shimmer */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: trailInterpolation,
          },
        ]}
      />

      {/* Moving shimmer line */}
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: shimmerTranslate }],
        }}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255,255,255,0.1)",
            "rgba(255,255,255,0.6)",
            "rgba(255,255,255,0.1)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 120,
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
});

export default AnimatedInputWrapper;

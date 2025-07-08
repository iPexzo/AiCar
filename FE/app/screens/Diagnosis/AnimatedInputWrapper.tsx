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
}

const AnimatedInputWrapper = React.forwardRef<
  { triggerAnimation: () => void },
  Props
>(({ children, style }, ref) => {
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeOverlay = useRef(new Animated.Value(0)).current;

  const triggerAnimation = () => {
    shimmerTranslate.setValue(-SCREEN_WIDTH);
    fadeOverlay.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shimmerTranslate, {
            toValue: SCREEN_WIDTH,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(fadeOverlay, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();
  };

  useImperativeHandle(ref, () => ({
    triggerAnimation,
  }));

  const overlayInterpolation = fadeOverlay.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.15)"],
  });

  return (
    <View style={[{ position: "relative", overflow: "hidden" }, style]}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: overlayInterpolation,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: shimmerTranslate }],
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 100,
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
});

export default AnimatedInputWrapper;

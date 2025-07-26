// File: frontend/src/components/layout/ScreenLayout.js
import React from "react";
import {
  View,
  SafeAreaView,
  ScrollView,
  StatusBar,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { globalStyles, colors, spacing } from "@styles/designSystem";
import StandardHeader from "./StandardHeader";

const ScreenLayout = ({
  children,
  title,
  showHeader = true,
  headerActions,
  scrollable = true,
  refreshing = false,
  onRefresh,
  backgroundColor = colors.background,
  contentPadding = true,
  keyboardAvoiding = false,
  safeAreaBackground = colors.background,
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;

  const contentProps = scrollable
    ? {
        style: styles.scrollView,
        contentContainerStyle: [
          styles.scrollContainer,
          !contentPadding && { paddingHorizontal: 0 },
        ],
        showsVerticalScrollIndicator: false,
        refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined,
      }
    : {
        style: [
          styles.staticContainer,
          !contentPadding && { paddingHorizontal: 0 },
        ],
      };

  return (
    <SafeAreaView
      style={[globalStyles.safeArea, { backgroundColor: safeAreaBackground }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={safeAreaBackground}
        translucent={false}
      />

      {showHeader && <StandardHeader title={title} actions={headerActions} />}

      <View style={[globalStyles.container, { backgroundColor }]}>
        <ContentWrapper {...contentProps}>{children}</ContentWrapper>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },

  staticContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});

export default ScreenLayout;

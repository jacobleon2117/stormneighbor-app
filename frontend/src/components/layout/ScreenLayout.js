// File: frontend/src/components/layout/ScreenLayout.js
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
  customHeaderComponent,
  scrollable = true,
  refreshing = false,
  onRefresh,
  backgroundColor = colors.background,
  contentPadding = true,
  keyboardAvoiding = false,
  safeAreaBackground = colors.surface,
  showDefaultActions = true,
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
    <View
      style={[styles.fullContainer, { backgroundColor: safeAreaBackground }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={safeAreaBackground}
        translucent={false}
      />

      <SafeAreaView style={styles.safeAreaTop} />

      {showHeader && (
        <StandardHeader
          title={title}
          actions={headerActions}
          showDefaultActions={showDefaultActions}
        />
      )}

      {customHeaderComponent && (
        <View style={styles.customHeaderContainer}>
          {customHeaderComponent}
        </View>
      )}

      <View style={[styles.contentContainer, { backgroundColor }]}>
        <ContentWrapper {...contentProps}>{children}</ContentWrapper>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },

  safeAreaTop: {
    flex: 0,
  },

  contentContainer: {
    flex: 1,
  },

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

  customHeaderContainer: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
});

export default ScreenLayout;

// File: frontend/src/components/MainLayout.js
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { Search, MessageCircle, MoreHorizontal } from "lucide-react-native";
import { mainStyles, mainColors } from "../styles/mainStyles";

const MainLayout = ({
  children,
  title,
  showHeader = true,
  showSearch = true,
  showMessages = true,
  showMore = true,
  scrollable = false,
  refreshControl,
  onSearchPress,
  onMessagesPress,
  onMorePress,
  headerRight,
  backgroundColor = mainColors.background,
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        style: mainStyles.content,
        contentContainerStyle: mainStyles.scrollContainer,
        showsVerticalScrollIndicator: false,
        refreshControl: refreshControl,
      }
    : { style: mainStyles.content };

  return (
    <SafeAreaView style={[mainStyles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      {showHeader && (
        <View style={mainStyles.header}>
          <Text style={mainStyles.headerTitle}>{title}</Text>

          {headerRight || (
            <View style={mainStyles.headerRight}>
              {showSearch && (
                <TouchableOpacity
                  style={mainStyles.headerButton}
                  onPress={onSearchPress}
                >
                  <Search size={24} color={mainColors.text.primary} />
                </TouchableOpacity>
              )}

              {showMessages && (
                <TouchableOpacity
                  style={mainStyles.headerButton}
                  onPress={onMessagesPress}
                >
                  <MessageCircle size={24} color={mainColors.text.primary} />
                </TouchableOpacity>
              )}

              {showMore && (
                <TouchableOpacity
                  style={mainStyles.headerButton}
                  onPress={onMorePress}
                >
                  <MoreHorizontal size={24} color={mainColors.text.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <ContentWrapper {...contentProps}>{children}</ContentWrapper>
    </SafeAreaView>
  );
};

export const MainHeader = ({ title, children }) => (
  <View style={mainStyles.header}>
    <Text style={mainStyles.headerTitle}>{title}</Text>
    {children}
  </View>
);

export const HeaderButton = ({ icon, onPress, active = false }) => (
  <TouchableOpacity
    style={[mainStyles.headerButton, active && mainStyles.headerButtonActive]}
    onPress={onPress}
  >
    {icon}
  </TouchableOpacity>
);

export const MainCard = ({ title, subtitle, children, onPress, style }) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[mainStyles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={mainStyles.cardHeader}>
          <View>
            {title && <Text style={mainStyles.cardTitle}>{title}</Text>}
            {subtitle && (
              <Text style={mainStyles.cardSubtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
      )}
      {children}
    </CardComponent>
  );
};

export const PostCard = ({ children, onPress }) => (
  <TouchableOpacity
    style={mainStyles.postCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {children}
  </TouchableOpacity>
);

export const PostHeader = ({ user, timeAgo, location, badge, onMorePress }) => (
  <View style={mainStyles.postHeader}>
    <View style={mainStyles.postAuthor}>
      <View style={mainStyles.avatar}>
        <Text style={mainStyles.avatarText}>{user?.firstName?.[0] || "U"}</Text>
      </View>
      <View style={mainStyles.authorInfo}>
        <View style={[mainStyles.row, mainStyles.alignCenter]}>
          <Text style={mainStyles.authorName}>
            {user?.firstName} {user?.lastName}
          </Text>
          {badge}
        </View>
        <Text style={mainStyles.postTime}>
          {timeAgo}
          {location ? ` • ${location}` : ""}
        </Text>
      </View>
    </View>
    {onMorePress && (
      <TouchableOpacity onPress={onMorePress}>
        <MoreHorizontal size={20} color={mainColors.text.muted} />
      </TouchableOpacity>
    )}
  </View>
);

export const PostContent = ({ title, content }) => (
  <View style={mainStyles.postContent}>
    {title && <Text style={mainStyles.postTitle}>{title}</Text>}
    <Text style={mainStyles.postText}>{content}</Text>
  </View>
);

export const PrimaryButton = ({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
  style,
}) => (
  <TouchableOpacity
    style={[
      mainStyles.primaryButton,
      disabled && mainStyles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    <View style={mainStyles.buttonContent}>
      {icon}
      <Text style={mainStyles.primaryButtonText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

export const SecondaryButton = ({
  title,
  onPress,
  icon,
  disabled = false,
  style,
}) => (
  <TouchableOpacity
    style={[
      mainStyles.secondaryButton,
      disabled && mainStyles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={mainStyles.buttonContent}>
      {icon}
      <Text style={mainStyles.secondaryButtonText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

export const AlertBadge = ({ type, children }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case "critical":
        return [mainStyles.badge, mainStyles.badgeCritical];
      case "warning":
        return [mainStyles.badge, mainStyles.badgeWarning];
      case "info":
        return [mainStyles.badge, mainStyles.badgeInfo];
      case "success":
        return [mainStyles.badge, mainStyles.badgeSuccess];
      default:
        return [mainStyles.badge, mainStyles.badgeInfo];
    }
  };

  const getBadgeTextStyle = () => {
    switch (type) {
      case "critical":
        return [mainStyles.badgeText, mainStyles.badgeCriticalText];
      case "warning":
        return [mainStyles.badgeText, mainStyles.badgeWarningText];
      case "info":
        return [mainStyles.badgeText, mainStyles.badgeInfoText];
      case "success":
        return [mainStyles.badgeText, mainStyles.badgeSuccessText];
      default:
        return [mainStyles.badgeText, mainStyles.badgeInfoText];
    }
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getBadgeTextStyle()}>{children}</Text>
    </View>
  );
};

export const ActionButton = ({
  icon,
  label,
  count,
  onPress,
  active = false,
}) => (
  <TouchableOpacity
    style={[mainStyles.actionButton, active && mainStyles.actionButtonActive]}
    onPress={onPress}
  >
    {icon}
    <Text
      style={[mainStyles.actionText, active && mainStyles.actionTextActive]}
    >
      {count !== undefined ? count : label}
    </Text>
  </TouchableOpacity>
);

export const LoadingState = ({ message = "Loading..." }) => (
  <View style={mainStyles.loadingContainer}>
    <Text style={mainStyles.loadingText}>{message}</Text>
  </View>
);

export const EmptyState = ({ title, message, action, icon }) => (
  <View style={mainStyles.emptyContainer}>
    {icon}
    <Text style={mainStyles.emptyTitle}>{title}</Text>
    <Text style={mainStyles.emptyText}>{message}</Text>
    {action}
  </View>
);

export const MainInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  focused = false,
  style,
  ...props
}) => (
  <View style={mainStyles.marginBottom16}>
    {label && <Text style={mainStyles.label}>{label}</Text>}
    <TextInput
      style={[
        mainStyles.input,
        multiline && mainStyles.inputMultiline,
        focused && mainStyles.inputFocused,
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={mainColors.text.muted}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      {...props}
    />
  </View>
);

export default MainLayout;

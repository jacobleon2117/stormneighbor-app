import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, MapPin, Calendar, MoreHorizontal, Grid3X3, Users } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Button } from "../UI/Button";
import { PostCard } from "../Posts/PostCard";
import { apiService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Post, User } from "../../types";

interface UserProfileModalProps {
  visible: boolean;
  userId: number | null;
  onClose: () => void;
}

interface UserProfile extends User {
  postCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

interface TabType {
  key: "posts" | "followers" | "following";
  label: string;
  icon: React.ComponentType<any>;
}

const TABS: TabType[] = [
  { key: "posts", label: "Posts", icon: Grid3X3 },
  { key: "followers", label: "Followers", icon: Users },
  { key: "following", label: "Following", icon: Users },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, userId, onClose }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await apiService.getApi().get(`/users/${userId}`);
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        const userProfile: UserProfile = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          bio: userData.bio,
          profileImageUrl: userData.profile_image_url,
          locationCity: userData.city,
          addressState: userData.state,
          showCityOnly: userData.show_city_only,
          emailVerified: userData.email_verified,
          isActive: true,
          notificationPreferences: {
            emailNotifications: false,
            pushNotifications: false,
            emergencyAlerts: false,
            weatherAlerts: false,
            communityUpdates: false,
            postReactions: false,
            comments: false,
            quietHoursEnabled: false,
          },
          postCount: userData.post_count || 0,
          followersCount: userData.followers_count || 0,
          followingCount: userData.following_count || 0,
          isFollowing: false,
          isBlocked: false,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        };
        setProfile(userProfile);
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [userId, onClose]);

  const loadTabData = useCallback(async () => {
    if (!userId || !profile) return;

    try {
      setLoading(true);

      switch (activeTab) {
        case "posts":
          const postsResponse = await apiService.getUserPosts(userId);
          if (postsResponse.success && postsResponse.data?.posts) {
            setPosts(postsResponse.data.posts);
          }
          break;

        case "followers":
          const followersResponse = await apiService.getFollowers(userId);
          if (followersResponse.success && followersResponse.data?.followers) {
            setFollowers(followersResponse.data.followers);
          }
          break;

        case "following":
          const followingResponse = await apiService.getFollowing(userId);
          if (followingResponse.success && followingResponse.data?.following) {
            setFollowing(followingResponse.data.following);
          }
          break;
      }
    } catch (error) {
      console.error(`Error loading ${activeTab} data:`, error);
    } finally {
      setLoading(false);
    }
  }, [userId, profile, activeTab]);

  useEffect(() => {
    if (visible && userId) {
      loadUserProfile();
    }
  }, [visible, userId, loadUserProfile]);

  useEffect(() => {
    if (profile) {
      loadTabData();
    }
  }, [activeTab, profile, loadTabData]);

  const handleFollow = async () => {
    if (!userId || !profile) return;

    try {
      setActionLoading("follow");

      if (profile.isFollowing) {
        await apiService.unfollowUser(userId);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1,
        });
      } else {
        await apiService.followUser(userId);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1,
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      Alert.alert("Error", "Failed to update follow status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = () => {
    if (!profile) return;

    Alert.alert(
      "Send Message",
      `Start a conversation with ${profile.firstName} ${profile.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Message",
          onPress: () => {
            router.push(`/conversation/${profile.id}`);
            onClose();
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    if (!userId || !profile) return;

    Alert.alert(
      "Block User",
      `Are you sure you want to block ${profile.firstName} ${profile.lastName}? You won't see their posts or be able to message them.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading("block");
              await apiService.blockUser(userId);
              Alert.alert("User Blocked", "The user has been blocked successfully.");
              onClose();
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", "Failed to block user");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert("Report User", "Why are you reporting this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Spam",
        onPress: () => submitReport("spam", "This user is posting spam"),
      },
      {
        text: "Harassment",
        onPress: () => submitReport("harassment", "This user is harassing others"),
      },
      {
        text: "Inappropriate Content",
        onPress: () => submitReport("inappropriate", "This user posts inappropriate content"),
      },
      {
        text: "Fake Account",
        onPress: () => submitReport("fake", "This appears to be a fake account"),
      },
    ]);
  };

  const submitReport = async (reason: string, description: string) => {
    if (!userId) return;
    try {
      const response = await apiService.getApi().post(`/users/${userId}/report`, {
        reason,
        description,
      });
      if (response.data.success) {
        Alert.alert("Thank you", "Your report has been submitted for review.");
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit report.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      );
    }

    switch (activeTab) {
      case "posts":
        return (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onLike={() => {}}
                onComment={() => {}}
                onShare={() => {}}
                currentUserId={currentUser?.id}
              />
            )}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Grid3X3 size={48} color={Colors.text.disabled} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyMessage}>This user hasn't posted anything yet.</Text>
              </View>
            }
          />
        );

      case "followers":
        return (
          <FlatList
            data={followers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userItem}>
                <Image
                  source={{ uri: item.profileImageUrl || undefined }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.userLocation}>
                    {item.locationCity && item.addressState
                      ? `${item.locationCity}, ${item.addressState}`
                      : "Location not specified"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Users size={48} color={Colors.text.disabled} />
                <Text style={styles.emptyTitle}>No followers yet</Text>
                <Text style={styles.emptyMessage}>This user doesn't have any followers yet.</Text>
              </View>
            }
          />
        );

      case "following":
        return (
          <FlatList
            data={following}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userItem}>
                <Image
                  source={{ uri: item.profileImageUrl || undefined }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.userLocation}>
                    {item.locationCity && item.addressState
                      ? `${item.locationCity}, ${item.addressState}`
                      : "Location not specified"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Users size={48} color={Colors.text.disabled} />
                <Text style={styles.emptyTitle}>Not following anyone</Text>
                <Text style={styles.emptyMessage}>This user isn't following anyone yet.</Text>
              </View>
            }
          />
        );

      default:
        return null;
    }
  };

  if (!visible || !profile) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleReport} style={styles.moreButton}>
            <MoreHorizontal size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profile.profileImageUrl || undefined }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.firstName} {profile.lastName}
              </Text>
              {profile.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}

              {(profile.locationCity || profile.addressState) && (
                <View style={styles.locationContainer}>
                  <MapPin size={16} color={Colors.text.secondary} />
                  <Text style={styles.locationText}>
                    {profile.locationCity && profile.addressState
                      ? `${profile.locationCity}, ${profile.addressState}`
                      : profile.locationCity || profile.addressState}
                  </Text>
                </View>
              )}

              <View style={styles.joinDateContainer}>
                <Calendar size={16} color={Colors.text.secondary} />
                <Text style={styles.joinDateText}>
                  Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title={profile.isFollowing ? "Unfollow" : "Follow"}
              onPress={handleFollow}
              loading={actionLoading === "follow"}
              variant={profile.isFollowing ? "secondary" : "primary"}
              style={styles.followButton}
            />
            <Button
              title="Message"
              onPress={handleMessage}
              variant="secondary"
              style={styles.messageButton}
            />
            <Button
              title="Block"
              onPress={handleBlock}
              loading={actionLoading === "block"}
              variant="outline"
              style={styles.blockButton}
            />
          </View>

          <View style={styles.tabs}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon size={20} color={isActive ? Colors.primary[500] : Colors.text.secondary} />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {renderTabContent()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral[200],
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  joinDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  joinDateText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  followButton: {
    flex: 2,
  },
  messageButton: {
    flex: 2,
  },
  blockButton: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  tabLabelActive: {
    color: Colors.primary[500],
    fontWeight: "600",
  },
  tabContent: {
    paddingVertical: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[200],
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});

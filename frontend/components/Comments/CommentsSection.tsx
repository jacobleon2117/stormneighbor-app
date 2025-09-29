import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { CommentCard } from "./CommentCard";
import { Button } from "../UI/Button";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import { Comment } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { ErrorHandler } from "../../utils/errorHandler";

interface CommentsSectionProps {
  postId: number;
  onCommentCountChange?: (count: number) => void;
}

export function CommentsSection({ postId, onCommentCountChange }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComments = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      try {
        if (pageNum === 1) {
          setError(null);
        }

        const response = await apiService.getComments(postId, {
          page: pageNum,
          limit: 20,
        });

        if (response.success && response.data) {
          const newComments = response.data.comments || response.data;

          if (isRefresh || pageNum === 1) {
            setComments(newComments);
          } else {
            setComments((prev) => [...prev, ...newComments]);
          }

          if (newComments.length < 20) {
            setHasMore(false);
          }

          setPage(pageNum);

          const totalCount = response.data.total || newComments.length;
          onCommentCountChange?.(totalCount);
        }
      } catch (error: any) {
        ErrorHandler.silent(error, "Fetch Comments");
        const errorMessage = error.response?.data?.message || "Failed to load comments";

        if (pageNum === 1) {
          setError(errorMessage);
        } else {
          Alert.alert("Error", "Failed to load more comments");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [postId, onCommentCountChange]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchComments(1, true);
  }, [fetchComments]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && comments.length > 0) {
      setLoadingMore(true);
      fetchComments(page + 1, false);
    }
  }, [loadingMore, hasMore, page, comments.length, fetchComments]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiService.createComment(postId, {
        content: newComment.trim(),
      });

      if (response.success && response.data) {
        const comment = response.data;
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
        onCommentCountChange?.(comments.length + 1);
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Create Comment");
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to post comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId: number, content: string) => {
    try {
      const response = await apiService.createComment(postId, {
        content,
        parentCommentId,
      });

      if (response.success && response.data) {
        const reply = response.data;

        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), reply],
              };
            }
            return comment;
          })
        );

        onCommentCountChange?.(comments.length + 1);
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Create Reply");
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to post reply. Please try again."
      );
      throw error;
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      const updateComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            userReaction: comment.userReaction ? null : "like",
            reactionCount: comment.userReaction
              ? (comment.reactionCount || 1) - 1
              : (comment.reactionCount || 0) + 1,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment),
          };
        }
        return comment;
      };

      setComments((prev) => prev.map(updateComment));

      const targetComment = findCommentById(comments, commentId);

      if (targetComment?.userReaction) {
        await apiService.removeCommentReaction(commentId);
      } else {
        await apiService.toggleCommentReaction(commentId, "like");
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Toggle Like");

      const revertComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            userReaction: comment.userReaction ? null : "like",
            reactionCount: comment.userReaction
              ? (comment.reactionCount || 1) - 1
              : (comment.reactionCount || 0) + 1,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(revertComment),
          };
        }
        return comment;
      };

      setComments((prev) => prev.map(revertComment));
      Alert.alert("Error", "Failed to update reaction. Please try again.");
    }
  };

  const handleEdit = async (commentId: number, content: string) => {
    try {
      const response = await apiService.updateComment(commentId, content);

      if (response.success) {
        const updateComment = (comment: Comment): Comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content,
              isEdited: true,
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(updateComment),
            };
          }
          return comment;
        };

        setComments((prev) => prev.map(updateComment));
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Edit Comment");
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to edit comment. Please try again."
      );
      throw error;
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const response = await apiService.deleteComment(commentId);

      if (response.success) {
        const removeComment = (commentsList: Comment[]): Comment[] => {
          return commentsList
            .filter((comment) => comment.id !== commentId)
            .map((comment) => ({
              ...comment,
              replies: comment.replies ? removeComment(comment.replies) : undefined,
            }));
        };

        setComments((prev) => {
          const newComments = removeComment(prev);
          onCommentCountChange?.(newComments.length);
          return newComments;
        });
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Delete Comment");
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to delete comment. Please try again."
      );
    }
  };

  const handleReport = async (commentId: number) => {
    try {
      const response = await apiService.reportComment(
        commentId,
        "inappropriate",
        "Reported via mobile app"
      );

      if (response.success) {
        Alert.alert(
          "Success",
          "Comment has been reported. Thank you for helping keep our community safe."
        );
      }
    } catch (error: any) {
      ErrorHandler.silent(error, "Report Comment");
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to report comment. Please try again."
      );
    }
  };

  const findCommentById = (commentsList: Comment[], id: number): Comment | null => {
    for (const comment of commentsList) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const renderComment = ({ item }: { item: Comment }) => (
    <CommentCard
      comment={item}
      onReply={handleReply}
      onLike={handleLike}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onReport={handleReport}
      currentUserId={user?.id}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Comments ({comments.length})</Text>

      <View style={styles.newCommentContainer}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          placeholderTextColor={Colors.text.disabled}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
        <Button
          title="Post"
          onPress={handleCreateComment}
          loading={submitting}
          disabled={!newComment.trim()}
          size="small"
          style={styles.postButton}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptyMessage}>Be the first to share your thoughts on this post!</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading more comments...</Text>
      </View>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  if (error && comments.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load comments</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button
          title="Try Again"
          onPress={() => fetchComments(1)}
          variant="outline"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={comments}
      renderItem={renderComment}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[Colors.primary[600]]}
          tintColor={Colors.primary[600]}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  newCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  postButton: {
    minWidth: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
});

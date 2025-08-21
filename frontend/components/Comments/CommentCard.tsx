import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../types';
import { Colors } from '../../constants/Colors';
import { Button } from '../UI/Button';

interface CommentCardProps {
  comment: Comment;
  onReply?: (commentId: number, content: string) => void;
  onLike?: (commentId: number) => void;
  onEdit?: (commentId: number, content: string) => void;
  onDelete?: (commentId: number) => void;
  onReport?: (commentId: number) => void;
  currentUserId?: number;
  depth?: number;
  maxDepth?: number;
}

export function CommentCard({
  comment,
  onReply,
  onLike,
  onEdit,
  onDelete,
  onReport,
  currentUserId,
  depth = 0,
  maxDepth = 3,
}: CommentCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showEditInput, setShowEditInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId === comment.userId;
  const canReply = depth < maxDepth;

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - commentDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return commentDate.toLocaleDateString();
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply?.(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || editContent.trim() === comment.content) {
      setShowEditInput(false);
      setEditContent(comment.content);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit?.(comment.id, editContent.trim());
      setShowEditInput(false);
    } catch (error) {
      console.error('Error editing comment:', error);
      setEditContent(comment.content);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(comment.id),
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => onReport?.(comment.id),
        },
        {
          text: 'Harassment',
          onPress: () => onReport?.(comment.id),
        },
        {
          text: 'Inappropriate Content',
          onPress: () => onReport?.(comment.id),
        },
      ]
    );
  };

  return (
    <View style={[
      styles.container,
      { marginLeft: depth * 20, borderLeftWidth: depth > 0 ? 2 : 0 },
    ]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {comment.profileImageUrl && !imageError ? (
              <Image
                source={{ uri: comment.profileImageUrl }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name="person" size={16} color={Colors.neutral[600]} />
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {comment.firstName} {comment.lastName}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimeAgo(comment.createdAt)}
              {comment.isEdited && (
                <Text style={styles.editedLabel}> • edited</Text>
              )}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            if (isOwner) {
              Alert.alert(
                'Comment Options',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Edit',
                    onPress: () => {
                      setEditContent(comment.content);
                      setShowEditInput(true);
                    },
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: handleDelete,
                  },
                ]
              );
            } else {
              handleReport();
            }
          }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={Colors.neutral[600]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {showEditInput ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              placeholder="Edit your comment..."
              placeholderTextColor={Colors.text.disabled}
              maxLength={1000}
            />
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowEditInput(false);
                  setEditContent(comment.content);
                }}
                variant="ghost"
                size="small"
              />
              <Button
                title="Save"
                onPress={handleEditSubmit}
                loading={isSubmitting}
                disabled={!editContent.trim()}
                size="small"
              />
            </View>
          </View>
        ) : (
          <Text style={styles.commentText}>{comment.content}</Text>
        )}

        {comment.images && comment.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {comment.images.slice(0, 2).map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.commentImage}
                resizeMode="cover"
              />
            ))}
            {comment.images.length > 2 && (
              <View style={styles.imageOverlay}>
                <Text style={styles.imageCount}>+{comment.images.length - 2}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike?.(comment.id)}
        >
          <Ionicons
            name={comment.userReaction ? 'heart' : 'heart-outline'}
            size={16}
            color={comment.userReaction ? Colors.error[600] : Colors.neutral[600]}
          />
          <Text
            style={[
              styles.actionText,
              comment.userReaction && styles.likedText,
            ]}
          >
            {comment.reactionCount || 0}
          </Text>
        </TouchableOpacity>

        {canReply && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReplyInput(!showReplyInput)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={Colors.neutral[600]}
            />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {showReplyInput && (
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            value={replyContent}
            onChangeText={setReplyContent}
            placeholder="Write a reply..."
            placeholderTextColor={Colors.text.disabled}
            multiline
            maxLength={1000}
          />
          <View style={styles.replyActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowReplyInput(false);
                setReplyContent('');
              }}
              variant="ghost"
              size="small"
            />
            <Button
              title="Reply"
              onPress={handleReplySubmit}
              loading={isSubmitting}
              disabled={!replyContent.trim()}
              size="small"
            />
          </View>
        </View>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              currentUserId={currentUserId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderLeftColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  editedLabel: {
    fontStyle: 'italic',
  },
  menuButton: {
    padding: 4,
  },
  content: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    position: 'relative',
  },
  commentImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.neutral[900],
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCount: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  likedText: {
    color: Colors.error[600],
  },
  replyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  repliesContainer: {
    marginTop: 8,
  },
});
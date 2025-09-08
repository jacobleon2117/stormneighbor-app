import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import {
  MapPin,
  Share,
  Eye,
  X,
  AlertTriangle,
  Users,
  Shield,
  HelpCircle,
  Calendar,
  MessageSquare,
  Megaphone,
  CloudRain,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { ALERT_COLORS, ALERT_LABELS } from "../../constants/AlertColors";

interface AlertCardProps {
  id: string;
  type:
    | "severe_weather"
    | "community_alerts"
    | "safety_alerts"
    | "help_needed"
    | "events"
    | "questions"
    | "announcements"
    | "weather_alerts";
  title: string;
  description: string;
  timestamp: string;
  locations: string[];
  onView?: () => void;
  onShare?: () => void;
}

const ALERT_ICONS = {
  severe_weather: AlertTriangle,
  weather_alert: CloudRain,
  weather_alerts: CloudRain,
  community_alert: Users,
  community_alerts: Users,
  safety_alert: Shield,
  safety_alerts: Shield,
  help_needed: HelpCircle,
  help_request: HelpCircle,
  help_offer: Users,
  events: Calendar,
  event: Calendar,
  questions: MessageSquare,
  question: MessageSquare,
  announcements: Megaphone,
  announcement: Megaphone,
  general: MessageSquare,
  lost_found: MapPin,
} as const;

export default function AlertCard({
  id: _id,
  type,
  title,
  description,
  timestamp,
  locations,
  onView,
  onShare,
}: AlertCardProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);

  const IconComponent = ALERT_ICONS[type] || AlertTriangle;
  const alertColor = ALERT_COLORS[type] || Colors.primary[500];
  const badgeText = ALERT_LABELS[type] || "Alert";

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - alertDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return alertDate.toLocaleDateString();
  };

  const displayedLocation =
    locations.length > 1
      ? `${locations[0]} + ${locations.length - 1}`
      : locations[0] || "Unknown location";

  const handleLocationPress = () => {
    if (locations.length > 1) {
      setShowLocationModal(true);
    }
  };

  const handleView = () => {
    onView?.();
  };

  const handleShare = () => {
    onShare?.();
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconAndTitle}>
            <IconComponent size={20} color={alertColor} />
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: alertColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>

        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleLocationPress}
          disabled={locations.length <= 1}
        >
          <MapPin size={16} color={Colors.text.secondary} />
          <Text style={styles.locationText}>{displayedLocation}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleView}>
              <Eye size={16} color={Colors.primary[600]} />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share size={16} color={Colors.primary[600]} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timestamp}>{formatTimeAgo(timestamp)}</Text>
        </View>
      </View>

      <Modal
        visible={showLocationModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Affected Locations</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.locationsList}>
              {locations.map((location, index) => (
                <View key={index} style={styles.locationItem}>
                  <MapPin size={16} color={Colors.text.secondary} />
                  <Text style={styles.locationItemText}>{location}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.inverse,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary[600],
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.text.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  locationsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationItemText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
});

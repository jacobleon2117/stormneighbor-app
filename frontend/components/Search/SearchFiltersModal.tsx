import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Filter, RotateCcw } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { Button } from "../UI/Button";
import { SearchFilters } from "../../types";

interface SearchFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: (filters: SearchFilters) => void;
}

const POST_TYPES = [
  { key: "general", label: "General" },
  { key: "help_request", label: "Help Requests" },
  { key: "help_offer", label: "Help Offers" },
  { key: "safety_alert", label: "Safety Alerts" },
  { key: "lost_found", label: "Lost & Found" },
  { key: "question", label: "Questions" },
  { key: "event", label: "Events" },
  { key: "announcement", label: "Announcements" },
];

const PRIORITIES = [
  { key: "low", label: "Low", color: Colors.neutral[500] },
  { key: "normal", label: "Normal", color: Colors.primary[500] },
  { key: "high", label: "High", color: Colors.warning[500] },
  { key: "urgent", label: "Urgent", color: Colors.error[500] },
];

const SORT_OPTIONS = [
  { key: "relevance", label: "Most Relevant" },
  { key: "date", label: "By Date" },
  { key: "popularity", label: "Most Popular" },
];

export const SearchFiltersModal: React.FC<SearchFiltersModalProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (array: string[], value: string, key: keyof SearchFilters) => {
    const newArray = array.includes(value)
      ? array.filter((item) => item !== value)
      : [...array, value];
    updateFilter(key, newArray as any);
  };

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      types: [],
      priorities: [],
      emergencyOnly: false,
      resolved: "all",
      sortBy: "relevance",
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const applyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const hasActiveFilters =
    (localFilters.types && localFilters.types.length > 0) ||
    (localFilters.priorities && localFilters.priorities.length > 0) ||
    localFilters.emergencyOnly ||
    localFilters.resolved !== "all" ||
    localFilters.sortBy !== "relevance";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Filter size={24} color={Colors.primary[500]} />
            <Text style={styles.headerTitle}>Search Filters</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Types</Text>
            <View style={styles.filterGrid}>
              {POST_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.filterChip,
                    (localFilters.types || []).includes(type.key) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleArrayFilter(localFilters.types || [], type.key, "types")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      (localFilters.types || []).includes(type.key) && styles.filterChipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Levels</Text>
            <View style={styles.filterGrid}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.key}
                  style={[
                    styles.filterChip,
                    (localFilters.priorities || []).includes(priority.key) && {
                      backgroundColor: priority.color + "20",
                      borderColor: priority.color,
                    },
                  ]}
                  onPress={() =>
                    toggleArrayFilter(localFilters.priorities || [], priority.key, "priorities")
                  }
                >
                  <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                  <Text
                    style={[
                      styles.filterChipText,
                      (localFilters.priorities || []).includes(priority.key) && {
                        color: priority.color,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleSection}
              onPress={() => updateFilter("emergencyOnly", !localFilters.emergencyOnly)}
            >
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleTitle}>Emergency Only</Text>
                <Text style={styles.toggleSubtitle}>Show only urgent emergency alerts</Text>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  localFilters.emergencyOnly && styles.toggleSwitchActive,
                ]}
              >
                <View
                  style={[styles.toggleKnob, localFilters.emergencyOnly && styles.toggleKnobActive]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Status</Text>
            <View style={styles.radioGroup}>
              {[
                { key: "all", label: "All Posts" },
                { key: "resolved", label: "Resolved Only" },
                { key: "unresolved", label: "Unresolved Only" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.radioOption}
                  onPress={() => updateFilter("resolved", option.key as any)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      localFilters.resolved === option.key && styles.radioButtonActive,
                    ]}
                  >
                    {localFilters.resolved === option.key && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortGrid}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortChip,
                    localFilters.sortBy === option.key && styles.sortChipActive,
                  ]}
                  onPress={() => updateFilter("sortBy", option.key as any)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      localFilters.sortBy === option.key && styles.sortChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
              <RotateCcw size={16} color={Colors.text.secondary} />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <View style={styles.footerButtons}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.cancelButton}
            />
            <Button
              title={hasActiveFilters ? `Apply Filters` : "Close"}
              onPress={applyFilters}
              style={styles.applyButton}
            />
          </View>
        </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    backgroundColor: Colors.neutral[200],
    borderRadius: 15,
    justifyContent: "center",
    position: "relative",
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary[500],
  },
  toggleKnob: {
    width: 26,
    height: 26,
    backgroundColor: Colors.background,
    borderRadius: 13,
    position: "absolute",
    left: 2,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    left: 22,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonActive: {
    borderColor: Colors.primary[500],
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary[500],
  },
  radioLabel: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  sortGrid: {
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  sortChipText: {
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: "center",
  },
  sortChipTextActive: {
    color: Colors.primary[700],
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});

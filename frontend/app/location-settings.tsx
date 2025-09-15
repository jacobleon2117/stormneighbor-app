import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TextInput, TouchableOpacity } from "react-native";
import { Search, X } from "lucide-react-native";
import { router } from "expo-router";
import { Header } from "../components/UI/Header";
import { Input } from "../components/UI/Input";
import { Button } from "../components/UI/Button";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";

interface LocationForm {
  address: string;
  locationCity: string;
  addressState: string;
  zipCode: string;
  locationRadiusMiles: number;
  showCityOnly: boolean;
}

export default function LocationSettingsScreen() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [locationForm, setLocationForm] = useState<LocationForm>({
    address: "",
    locationCity: "",
    addressState: "",
    zipCode: "",
    locationRadiusMiles: 5,
    showCityOnly: true,
  });

  useEffect(() => {
    if (user) {
      setLocationForm({
        address: user.address || "",
        locationCity: user.locationCity || "",
        addressState: user.addressState || "",
        zipCode: user.zipCode || "",
        locationRadiusMiles: user.locationRadiusMiles || 5,
        showCityOnly: user.showCityOnly ?? true,
      });
    }
  }, [user]);

  const handleSaveLocation = async () => {
    if (!locationForm.locationCity.trim() || !locationForm.addressState.trim()) {
      Alert.alert("Error", "City and state are required.");
      return;
    }

    try {
      setLoading(true);
      await apiService.updateLocation({
        address: locationForm.address.trim(),
        locationCity: locationForm.locationCity.trim(),
        addressState: locationForm.addressState.trim().toUpperCase(),
        zipCode: locationForm.zipCode.trim(),
        locationRadiusMiles: locationForm.locationRadiusMiles,
        showCityOnly: locationForm.showCityOnly,
      });

      await refreshProfile();
      Alert.alert("Success", "Location settings updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Location update error:", error);
      Alert.alert("Error", "Failed to update location settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContent = () => {
    if (!searchQuery.trim()) return null;

    const searchableItems = [
      { label: "Street Address", content: "address location" },
      { label: "City", content: "city location" },
      { label: "State", content: "state location" },
      { label: "ZIP Code", content: "zip postal code" },
      { label: "Notification Radius", content: "radius distance notifications" },
      { label: "Show City Only", content: "privacy city visibility" },
      { label: "Privacy", content: "privacy security address sharing" },
    ];

    const filtered = searchableItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.length > 0 ? filtered : null;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Location Settings"
        showBackButton
        onBackPress={() => router.back()}
        showSearch
        onSearchPress={() => setShowSearch(!showSearch)}
      />

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location settings"
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(""); }}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showSearch && searchQuery.trim() && (
          <View style={styles.searchResults}>
            {getFilteredContent() ? (
              getFilteredContent()!.map((item, index) => (
                <View key={index} style={styles.searchResultItem}>
                  <Text style={styles.searchResultLabel}>{item.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noResultsText}>No matching settings found</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your location helps neighbors find relevant posts and ensures you receive alerts for
              your area.
            </Text>
          </View>

          <Input
            label="Street Address"
            value={locationForm.address}
            onChangeText={(address) => setLocationForm((prev) => ({ ...prev, address }))}
            placeholder="123 Main St (optional)"
          />

          <View style={styles.row}>
            <Input
              label="City"
              value={locationForm.locationCity}
              onChangeText={(locationCity) =>
                setLocationForm((prev) => ({ ...prev, locationCity }))
              }
              required
              containerStyle={{ flex: 2, marginRight: 8 }}
              placeholder="Your city"
            />
            <Input
              label="State"
              value={locationForm.addressState}
              onChangeText={(addressState) =>
                setLocationForm((prev) => ({ ...prev, addressState: addressState.toUpperCase() }))
              }
              placeholder="CA"
              maxLength={2}
              required
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <Input
            label="ZIP Code"
            value={locationForm.zipCode}
            onChangeText={(zipCode) => setLocationForm((prev) => ({ ...prev, zipCode }))}
            keyboardType="numeric"
            maxLength={5}
            placeholder="90210 (optional)"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notification Radius (miles)</Text>
            <Input
              value={locationForm.locationRadiusMiles.toString()}
              onChangeText={(value) =>
                setLocationForm((prev) => ({
                  ...prev,
                  locationRadiusMiles: Math.max(1, Math.min(50, parseInt(value) || 5)),
                }))
              }
              keyboardType="numeric"
              placeholder="5"
            />
            <Text style={styles.helpText}>
              Receive notifications for posts within this distance (1-50 miles)
            </Text>
          </View>

          <View style={styles.switchSection}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Show City Only</Text>
                <Text style={styles.switchDescription}>
                  Hide your exact address and only show city/state to other users
                </Text>
              </View>
              <Switch
                value={locationForm.showCityOnly}
                onValueChange={(showCityOnly) =>
                  setLocationForm((prev) => ({ ...prev, showCityOnly }))
                }
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[300] }}
                thumbColor={locationForm.showCityOnly ? Colors.primary[500] : Colors.neutral[500]}
              />
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Your exact address is never shared publicly. Other users will only see your city
              and state unless you choose to share more specific location information in individual
              posts.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.footerButton}
          disabled={loading}
        />
        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSaveLocation}
          loading={loading}
          disabled={!locationForm.locationCity.trim() || !locationForm.addressState.trim()}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  section: {
    gap: 16,
    paddingBottom: 20,
  },
  infoBox: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary[700],
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.disabled,
    lineHeight: 16,
  },
  switchSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  privacyNote: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    padding: 16,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerButton: {
    flex: 1,
    height: 48,
  },
  searchContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    height: "100%",
  },
  searchResults: {
    backgroundColor: Colors.background,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchResultLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});

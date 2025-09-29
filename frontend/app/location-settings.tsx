import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "../components/UI/Header";
import { Input } from "../components/UI/Input";
import { Button } from "../components/UI/Button";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/Colors";
import { apiService } from "../services/api";
import { ErrorHandler } from "../utils/errorHandler";

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
      ErrorHandler.silent(error as Error, "Location update error");
      Alert.alert("Error", "Failed to update location settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Location Settings" showBackButton onBackPress={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
});

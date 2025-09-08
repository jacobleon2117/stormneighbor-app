import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Cloud, Plus, AlertTriangle, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          position: "absolute",
          bottom: 34,
          backgroundColor: "#ffffff",
          borderRadius: 22,
          paddingBottom: 4,
          paddingTop: 4,
          height: 64,
          marginHorizontal: 32,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 12,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
          paddingVertical: 2,
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          height: "100%",
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: "Weather",
          tabBarIcon: ({ color }) => <Cloud size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Post",
          tabBarStyle: { display: "none" },
          tabBarIcon: () => (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 14,
                backgroundColor: "#2563eb",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Plus size={18} strokeWidth={2.5} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <AlertTriangle size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

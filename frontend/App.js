// File: frontend/App.js
import MainApp from "@screens/main/MainApp";

export default function App() {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    neighborhoodId: 1,
    neighborhoodName: "Downtown Test Area",
    isVerified: true,
  };

  const handleLogout = () => {
    console.log("Logout pressed");
  };

  return <MainApp user={mockUser} onLogout={handleLogout} />;
}

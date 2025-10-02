// Create a new file: components/TestAuth.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

export default function TestAuth() {
  const { user, isAuthenticated } = useAuth();

  const testAuth = async () => {
    try {
      console.log("🧪 Testing authentication...");
      console.log("User:", user);
      console.log("Is Authenticated:", isAuthenticated);

      // Test a simple authenticated endpoint
      const result = await api.get("/auth/verify"); // or any auth endpoint you have
      console.log("✅ Auth test passed:", result);
    } catch (error) {
      console.log("❌ Auth test failed:", error);
    }
  };

  return (
    <div style={{ padding: "1rem", background: "#f0f0f0", margin: "1rem 0" }}>
      <h3>Auth Debug</h3>
      <p>User: {user ? user.email : "Not logged in"}</p>
      <button onClick={testAuth} className="btn btn-sm">
        Test Authentication
      </button>
    </div>
  );
}

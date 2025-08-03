const axios = require("axios");

async function testAlerts() {
  try {
    const response = await axios.get("http://localhost:3000/api/alerts", {
      params: {
        latitude: 36.309144256756,
        longitude: -95.7822539665623,
        radius: 15,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error("Error fetching alerts:", error.response?.data || error.message);
  }
}

testAlerts();

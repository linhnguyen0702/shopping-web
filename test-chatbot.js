const fetch = require("node-fetch");

(async () => {
  try {
    const sessionId = `test_${Date.now()}`;
    const response = await fetch("http://localhost:8000/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "bàn ghế phòng khách",
        sessionId: sessionId,
      }),
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
})();

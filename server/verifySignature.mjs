// Verify VNPay signature from actual payment
import crypto from "crypto";
import qs from "qs";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.VNP_HASHSECRET;

console.log("=".repeat(80));
console.log("🔍 Verify VNPay Signature from Logs");
console.log("=".repeat(80));

// From your logs - the actual payment data
const actualPaymentParams = {
  vnp_Amount: "155000000", // 1550000 VND * 100
  vnp_Command: "pay",
  vnp_CreateDate: "20251113075914",
  vnp_CurrCode: "VND",
  vnp_IpAddr: ":1",
  vnp_Locale: "vn",
  vnp_OrderInfo: "Thanh toan don hang 79A9D92E",
  vnp_OrderType: "billpayment",
  vnp_ReturnUrl: "http://localhost:8000/api/payment/vnpay_return",
  vnp_TmnCode: "AYMMRTED",
  vnp_TxnRef: "69158fd249716ddf79a9d92e",
  vnp_Version: "2.1.0",
};

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

const sorted = sortObject(actualPaymentParams);
const signData = qs.stringify(sorted, { encode: false });

console.log("\n📝 Sign Data String:");
console.log(signData);

console.log("\n🔑 Secret Key Info:");
console.log("Length:", secretKey.length);
console.log("Last 4 chars:", secretKey.slice(-4));
console.log("First 4 chars:", secretKey.slice(0, 4));

const hmac = crypto.createHmac("sha512", secretKey);
const calculatedHash = hmac
  .update(Buffer.from(signData, "utf-8"))
  .digest("hex");

console.log("\n✅ Calculated Hash:");
console.log(calculatedHash);

console.log("\n📋 From your logs, the generated hash was:");
console.log(
  "803e0d91cbb2cf313c5531de2977c60624d82deb771f09883b910d384f73ac7f693314366399ebbd9567cbe0e57d2b7c02ec2ea11045ea40597351feea1156e1"
);

console.log("\n🔍 Do they match?");
const logHash =
  "803e0d91cbb2cf313c5531de2977c60624d82deb771f09883b910d384f73ac7f693314366399ebbd9567cbe0e57d2b7c02ec2ea11045ea40597351feea1156e1";
console.log("Match:", calculatedHash === logHash ? "✅ YES" : "❌ NO");

if (calculatedHash !== logHash) {
  console.log("\n⚠️ HASHES DON'T MATCH!");
  console.log("This means the sign data might be different.");
  console.log("\nPossible causes:");
  console.log("1. IP address format difference (':1' vs '127.0.0.1')");
  console.log("2. Parameter values not matching exactly");
  console.log("3. Encoding issues");
}

console.log("\n" + "=".repeat(80));

// Test with URL-encoded OrderInfo (VNPay might encode it)
console.log("\n\n🧪 Test with URL-encoded OrderInfo:");
console.log("=".repeat(80));

const encodedParams = {
  ...actualPaymentParams,
  vnp_OrderInfo: "Thanh%20toan%20don%20hang%2079A9D92E",
};

const sortedEncoded = sortObject(encodedParams);
const signDataEncoded = qs.stringify(sortedEncoded, { encode: false });
const hmacEncoded = crypto.createHmac("sha512", secretKey);
const hashEncoded = hmacEncoded
  .update(Buffer.from(signDataEncoded, "utf-8"))
  .digest("hex");

console.log("Hash with encoded:", hashEncoded);
console.log("Match:", hashEncoded === logHash ? "✅ YES" : "❌ NO");

console.log("\n" + "=".repeat(80));

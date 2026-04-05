// Run with: node scripts/set-cors.mjs
// Uses FIREBASE_SERVICE_ACCOUNT_KEY from .env.local

import { Storage } from "@google-cloud/storage";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

const serviceAccount = JSON.parse(envVars["FIREBASE_SERVICE_ACCOUNT_KEY"]);
const storageBucket = envVars["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"];

console.log("📦 Targeting bucket:", storageBucket);

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount,
});

const corsConfig = [
  {
    origin: [
      "http://localhost:3000",
      "https://faculty-analytics-c4773.web.app",
      "https://faculty-analytics-c4773.firebaseapp.com",
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable",
    ],
  },
];

try {
  const bucket = storage.bucket(storageBucket);
  await bucket.setCorsConfiguration(corsConfig);
  console.log(`✅ CORS configured successfully for: ${storageBucket}`);
} catch (err) {
  console.error("❌ Error:", err.message);
  if (err.code === 404) {
    console.log("\n💡 The service account may not have 'Storage Admin' role.");
    console.log("   Go to: https://console.cloud.google.com/iam-admin/iam?project=faculty-analytics-c4773");
    console.log("   Find the service account and add 'Storage Admin' role.");
  }
}

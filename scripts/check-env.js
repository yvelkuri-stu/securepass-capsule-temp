// scripts/check-env.js
// Run this script to verify your environment variables

const requiredEnvs = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const optionalEnvs = ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_APP_URL"];

console.log("🔍 Environment Variables Check\n");

// Check required variables
console.log("📋 Required Variables:");
const missingRequired = [];
requiredEnvs.forEach((env) => {
  const value = process.env[env];
  if (value) {
    console.log(`✅ ${env}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${env}: Missing`);
    missingRequired.push(env);
  }
});

// Check optional variables
console.log("\n📋 Optional Variables:");
optionalEnvs.forEach((env) => {
  const value = process.env[env];
  if (value) {
    console.log(`✅ ${env}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${env}: Not set`);
  }
});

console.log("\n📊 Summary:");
if (missingRequired.length === 0) {
  console.log("✅ All required environment variables are set!");

  // Test Supabase URL format
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && !url.includes(".supabase.co")) {
    console.log("⚠️  Warning: SUPABASE_URL should end with .supabase.co");
  }
} else {
  console.log(`❌ Missing ${missingRequired.length} required variables:`);
  missingRequired.forEach((env) => console.log(`   - ${env}`));

  console.log("\n🔧 To fix this:");
  console.log(
    "1. Add these variables to your .env.local file (for development)"
  );
  console.log(
    "2. Add these variables to your Vercel dashboard (for production)"
  );
  console.log(
    "3. Make sure to restart your development server after adding variables"
  );

  process.exit(1);
}

// Add this to your package.json scripts:
// "check-env": "node scripts/check-env.js"

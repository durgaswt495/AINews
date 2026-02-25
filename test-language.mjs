import { detectLanguage } from "./dist/lib/language-service.js";

async function testLanguageDetection() {
  const testCases = [
    { text: "This is an English article about technology and AI", expected: "en" },
    { text: "Este es un artículo español sobre tecnología", expected: "es" },
    { text: "Ceci est un article français sur la technologie", expected: "fr" },
    { text: "Dies ist ein deutscher Artikel über Technologie", expected: "de" },
  ];

  console.log("Testing Language Detection Feature:\n");

  for (const testCase of testCases) {
    const detected = await detectLanguage(testCase.text);
    const status = detected === testCase.expected ? "✅" : "⚠️";
    console.log(`${status} Input: "${testCase.text.substring(0, 50)}..."`);
    console.log(`   Expected: ${testCase.expected}, Detected: ${detected}\n`);
  }

  console.log("Language detection test completed!");
}

testLanguageDetection().catch(console.error);

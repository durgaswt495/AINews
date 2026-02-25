import { detectLanguage, SUPPORTED_LANGUAGES } from "./dist/lib/language-service.js";

async function testIndianLanguages() {
  console.log("🇮🇳 Testing Indian Language Detection\n");
  console.log("=".repeat(60));

  const testCases = [
    {
      lang: "Hindi",
      text: "नई तकनीक से फोन की बैटरी चलेगी 5 दिन। कृत्रिम बुद्धिमत्ता के क्षेत्र में यह एक बड़ी सफलता है।",
      expected: "hi",
    },
    {
      lang: "Bengali",
      text: "নতুন প্রযুক্তি সহ স্মার্টফোনের ব্যাটারি ৫ দিন চলবে। এটি কৃত্রিম বুদ্ধিমত্তার ক্ষেত্রে একটি বড় সাফল্য।",
      expected: "bn",
    },
    {
      lang: "Tamil",
      text: "நாம் தற்போது புரட்சிகரமான செயற்கை நுண்ணறிவு தொழில்நுட்பத்தை சந்தித்து வருகிறோம்.",
      expected: "ta",
    },
    {
      lang: "Telugu",
      text: "కృత్రిమ మేధస్సు మరియు యంత్రాభిజ్ఞానం వ్యవహారం యొక్క భవిష్యత్తు నిర్ణయిస్తుంది.",
      expected: "te",
    },
    {
      lang: "Marathi",
      text: "डिजिटल भारतामध्ये नवीन तंत्रज्ञान हा एक महत्त्वाचा भूमिका बजावत आहे।",
      expected: "mr",
    },
    {
      lang: "Gujarati",
      text: "ગુજરાતમાં તકનીકી ઉદ્ભાવન અને સ્માર્ટ ટાઉનનો વિકાસ તીવ્રતર થઈ રહ્યો છે।",
      expected: "gu",
    },
    {
      lang: "Kannada",
      text: "ಕನ್ನಡ ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ನವೋದ್ಭಾವನದ ಕೇಂದ್ರವಾಗಿ ಮುಂದುವರೆದಿದೆ.",
      expected: "kn",
    },
    {
      lang: "Malayalam",
      text: "കേരളത്തിലെ ഐടി സമൃദ്ധി കഴിഞ്ഞ ദശകത്തിൽ ഗണ്യമായ വളർച്ച കൈവരിച്ചിരിക്കുന്നു.",
      expected: "ml",
    },
    {
      lang: "Punjabi",
      text: "ਪੰਜਾਬ ਵਿੱਚ ਮਾਈਕ੍ਰੋ-ਇਲੈਕਟ੍ਰਾਨਿਕਸ ਅਤੇ ਆਈਟੀ ਸੈਕਟਰ ਦੀ ਤੇਜ਼ੀ ਨਾਲ ਵਿਕਾਸ ਹੋ ਰਿਹਾ ਹੈ।",
      expected: "pa",
    },
    {
      lang: "English",
      text: "Artificial intelligence and machine learning are transforming the tech industry.",
      expected: "en",
    },
  ];

  for (const testCase of testCases) {
    try {
      const detected = await detectLanguage(testCase.text);
      const match = detected === testCase.expected;
      const symbol = match ? "✅" : "⚠️";

      console.log(`\n${symbol} ${testCase.lang}`);
      console.log(`   Text: "${testCase.text.substring(0, 50)}..."`);
      console.log(`   Expected: ${testCase.expected} | Detected: ${detected}`);

      if (match) {
        const langInfo = SUPPORTED_LANGUAGES[detected as keyof typeof SUPPORTED_LANGUAGES];
        if (langInfo) {
          console.log(
            `   ${langInfo.flag} ${langInfo.name} (${langInfo.script})`
          );
        }
      }
    } catch (error) {
      console.log(`\n❌ ${testCase.lang}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Indian language detection test completed!");
  console.log("\nSupported Indian Languages:");
  ["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml", "or", "pa"].forEach((code) => {
    const info = SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES];
    if (info) {
      console.log(`  ${info.flag} /${code} - ${info.name} (${info.script})`);
    }
  });
}

testIndianLanguages().catch(console.error);

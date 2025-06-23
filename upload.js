// upload.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

// Your Firebase config - REPLACE WITH YOUR ACTUAL CONFIG
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmg5WYVVsC6fTQcdvNDjXMN9sc7xzYYwU",
  authDomain: "vocabulary-38f8f.firebaseapp.com",
  projectId: "vocabulary-38f8f",
  storageBucket: "vocabulary-38f8f.firebasestorage.app",
  messagingSenderId: "88893388155",
  appId: "1:88893388155:web:c7d95cac1eb3850addf9de"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Extended vocabulary data with 50+ unique words
const vocabularyData = [
  {
    "word": "abandon",
    "adjective": "abandoned",
    "noun": "abandonment",
    "example": "They had to abandon the building during the fire drill.",
    "synonyms": ["desert", "forsake", "leave"]
  },
  {
    "word": "ability",
    "adjective": "able",
    "noun": "ability",
    "example": "She has the ability to solve complex problems.",
    "synonyms": ["capability", "skill", "talent"]
  },
  {
    "word": "achieve",
    "adjective": "achievable",
    "noun": "achievement",
    "example": "He worked hard to achieve his goals.",
    "synonyms": ["accomplish", "attain", "realize"]
  },
  {
    "word": "adapt",
    "adjective": "adaptable",
    "noun": "adaptation",
    "example": "Animals adapt to their environment over time.",
    "synonyms": ["adjust", "modify", "conform"]
  },
  {
    "word": "admire",
    "adjective": "admirable",
    "noun": "admiration",
    "example": "I really admire her dedication.",
    "synonyms": ["respect", "praise", "appreciate"]
  },
  {
    "word": "analyze",
    "adjective": "analytical",
    "noun": "analysis",
    "example": "Scientists analyze the data carefully.",
    "synonyms": ["examine", "evaluate", "study"]
  },
  {
    "word": "assist",
    "adjective": "assisting",
    "noun": "assistance",
    "example": "He offered to assist with the move.",
    "synonyms": ["help", "aid", "support"]
  },
  {
    "word": "believe",
    "adjective": "believable",
    "noun": "belief",
    "example": "I believe in your potential.",
    "synonyms": ["trust", "accept", "assume"]
  },
  {
    "word": "build",
    "adjective": "built",
    "noun": "building",
    "example": "They plan to build a new school.",
    "synonyms": ["construct", "erect", "develop"]
  },
  {
    "word": "calculate",
    "adjective": "calculative",
    "noun": "calculation",
    "example": "Can you calculate the total cost?",
    "synonyms": ["compute", "estimate", "figure out"]
  },
  {
    "word": "communicate",
    "adjective": "communicative",
    "noun": "communication",
    "example": "We need to communicate more effectively.",
    "synonyms": ["convey", "express", "share"]
  },
  {
    "word": "create",
    "adjective": "creative",
    "noun": "creation",
    "example": "Artists create beautiful works of art.",
    "synonyms": ["make", "produce", "generate"]
  },
  {
    "word": "decide",
    "adjective": "decisive",
    "noun": "decision",
    "example": "You need to decide which path to take.",
    "synonyms": ["choose", "determine", "resolve"]
  },
  {
    "word": "discover",
    "adjective": "discoverable",
    "noun": "discovery",
    "example": "They hope to discover new species.",
    "synonyms": ["find", "uncover", "reveal"]
  },
  {
    "word": "educate",
    "adjective": "educational",
    "noun": "education",
    "example": "Teachers educate students every day.",
    "synonyms": ["teach", "instruct", "train"]
  },
  {
    "word": "explore",
    "adjective": "exploratory",
    "noun": "exploration",
    "example": "Let's explore the new city together.",
    "synonyms": ["investigate", "examine", "discover"]
  },
  {
    "word": "focus",
    "adjective": "focused",
    "noun": "focus",
    "example": "Please focus on your studies.",
    "synonyms": ["concentrate", "center", "direct"]
  },
  {
    "word": "generate",
    "adjective": "generative",
    "noun": "generation",
    "example": "Solar panels generate clean energy.",
    "synonyms": ["produce", "create", "make"]
  },
  {
    "word": "imagine",
    "adjective": "imaginative",
    "noun": "imagination",
    "example": "Children love to imagine fantastic stories.",
    "synonyms": ["envision", "picture", "conceive"]
  },
  {
    "word": "improve",
    "adjective": "improved",
    "noun": "improvement",
    "example": "Practice will improve your skills.",
    "synonyms": ["enhance", "better", "upgrade"]
  },
  {
    "word": "inspire",
    "adjective": "inspiring",
    "noun": "inspiration",
    "example": "Great leaders inspire their teams.",
    "synonyms": ["motivate", "encourage", "stimulate"]
  },
  {
    "word": "investigate",
    "adjective": "investigative",
    "noun": "investigation",
    "example": "Police investigate crimes thoroughly.",
    "synonyms": ["examine", "explore", "research"]
  },
  {
    "word": "learn",
    "adjective": "learned",
    "noun": "learning",
    "example": "Students learn new concepts daily.",
    "synonyms": ["study", "acquire", "master"]
  },
  {
    "word": "manage",
    "adjective": "manageable",
    "noun": "management",
    "example": "She knows how to manage her time well.",
    "synonyms": ["handle", "control", "oversee"]
  },
  {
    "word": "motivate",
    "adjective": "motivational",
    "noun": "motivation",
    "example": "Good coaches motivate their athletes.",
    "synonyms": ["inspire", "encourage", "drive"]
  },
  {
    "word": "organize",
    "adjective": "organized",
    "noun": "organization",
    "example": "Please organize your desk before leaving.",
    "synonyms": ["arrange", "structure", "systematize"]
  },
  {
    "word": "participate",
    "adjective": "participatory",
    "noun": "participation",
    "example": "Everyone should participate in the discussion.",
    "synonyms": ["engage", "join", "contribute"]
  },
  {
    "word": "perform",
    "adjective": "performative",
    "noun": "performance",
    "example": "Musicians perform on stage nightly.",
    "synonyms": ["execute", "carry out", "accomplish"]
  },
  {
    "word": "prepare",
    "adjective": "prepared",
    "noun": "preparation",
    "example": "Students prepare for their exams.",
    "synonyms": ["ready", "arrange", "plan"]
  },
  {
    "word": "present",
    "adjective": "presentable",
    "noun": "presentation",
    "example": "She will present her research tomorrow.",
    "synonyms": ["show", "display", "demonstrate"]
  },
  {
    "word": "protect",
    "adjective": "protective",
    "noun": "protection",
    "example": "Helmets protect riders from injury.",
    "synonyms": ["guard", "shield", "defend"]
  },
  {
    "word": "recognize",
    "adjective": "recognizable",
    "noun": "recognition",
    "example": "I recognize that voice from somewhere.",
    "synonyms": ["identify", "acknowledge", "realize"]
  },
  {
    "word": "recommend",
    "adjective": "recommendable",
    "noun": "recommendation",
    "example": "I recommend this restaurant highly.",
    "synonyms": ["suggest", "advise", "propose"]
  },
  {
    "word": "reflect",
    "adjective": "reflective",
    "noun": "reflection",
    "example": "Take time to reflect on your choices.",
    "synonyms": ["contemplate", "consider", "ponder"]
  },
  {
    "word": "remember",
    "adjective": "memorable",
    "noun": "memory",
    "example": "Do you remember our first meeting?",
    "synonyms": ["recall", "recollect", "retain"]
  },
  {
    "word": "represent",
    "adjective": "representative",
    "noun": "representation",
    "example": "This graph represents our sales data.",
    "synonyms": ["symbolize", "stand for", "depict"]
  },
  {
    "word": "research",
    "adjective": "research-based",
    "noun": "research",
    "example": "Scientists research new treatments.",
    "synonyms": ["investigate", "study", "examine"]
  },
  {
    "word": "respond",
    "adjective": "responsive",
    "noun": "response",
    "example": "Please respond to my email promptly.",
    "synonyms": ["reply", "answer", "react"]
  },
  {
    "word": "solve",
    "adjective": "solvable",
    "noun": "solution",
    "example": "Mathematicians solve complex equations.",
    "synonyms": ["resolve", "fix", "answer"]
  },
  {
    "word": "succeed",
    "adjective": "successful",
    "noun": "success",
    "example": "Hard work helps you succeed in life.",
    "synonyms": ["achieve", "accomplish", "triumph"]
  },
  {
    "word": "support",
    "adjective": "supportive",
    "noun": "support",
    "example": "Friends support each other during tough times.",
    "synonyms": ["help", "assist", "back"]
  },
  {
    "word": "teach",
    "adjective": "teachable",
    "noun": "teaching",
    "example": "Experienced teachers teach with passion.",
    "synonyms": ["educate", "instruct", "train"]
  },
  {
    "word": "transform",
    "adjective": "transformative",
    "noun": "transformation",
    "example": "Education can transform lives completely.",
    "synonyms": ["change", "convert", "alter"]
  },
  {
    "word": "understand",
    "adjective": "understandable",
    "noun": "understanding",
    "example": "I understand your point of view.",
    "synonyms": ["comprehend", "grasp", "realize"]
  },
  {
    "word": "utilize",
    "adjective": "utilizable",
    "noun": "utilization",
    "example": "We should utilize our resources efficiently.",
    "synonyms": ["use", "employ", "apply"]
  },
  {
    "word": "validate",
    "adjective": "valid",
    "noun": "validation",
    "example": "Please validate your parking ticket.",
    "synonyms": ["confirm", "verify", "authenticate"]
  },
  {
    "word": "visualize",
    "adjective": "visual",
    "noun": "visualization",
    "example": "Athletes visualize success before competing.",
    "synonyms": ["imagine", "picture", "envision"]
  },
  {
    "word": "wonder",
    "adjective": "wonderful",
    "noun": "wonder",
    "example": "I wonder what the future holds.",
    "synonyms": ["ponder", "question", "speculate"]
  },
  {
    "word": "collaborate",
    "adjective": "collaborative",
    "noun": "collaboration",
    "example": "Teams collaborate to achieve common goals.",
    "synonyms": ["cooperate", "work together", "partner"]
  },
  {
    "word": "innovate",
    "adjective": "innovative",
    "noun": "innovation",
    "example": "Companies innovate to stay competitive.",
    "synonyms": ["create", "pioneer", "revolutionize"]
  },
  {
    "word": "evaluate",
    "adjective": "evaluative",
    "noun": "evaluation",
    "example": "Teachers evaluate student progress regularly.",
    "synonyms": ["assess", "judge", "appraise"]
  }
];

// Function to remove duplicates
function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(item => {
    if (seen.has(item.word)) {
      console.log(`Duplicate found: ${item.word} - skipping`);
      return false;
    }
    seen.add(item.word);
    return true;
  });
}

// Upload function using batch writes
async function uploadVocabulary() {
  try {
    // Remove duplicates first
    const uniqueData = removeDuplicates(vocabularyData);
    console.log(`Found ${vocabularyData.length} total words`);
    console.log(`Uploading ${uniqueData.length} unique words...`);

    // Firestore batch write (max 500 operations per batch)
    const batchSize = 500;
    let totalUploaded = 0;
    
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchData = uniqueData.slice(i, i + batchSize);
      
      batchData.forEach((wordData) => {
        const docRef = doc(collection(db, 'vocabulary'), wordData.word);
        batch.set(docRef, {
          word: wordData.word,
          adjective: wordData.adjective,
          noun: wordData.noun,
          example: wordData.example,
          synonyms: wordData.synonyms,
          createdAt: new Date(),
        });
      });
      
      await batch.commit();
      totalUploaded += batchData.length;
      console.log(`Batch ${Math.floor(i/batchSize) + 1} uploaded successfully (${batchData.length} words)`);
      console.log(`Progress: ${totalUploaded}/${uniqueData.length} words uploaded`);
    }
    
    console.log('✅ All vocabulary data uploaded successfully!');
    console.log(`📊 Total unique words uploaded: ${uniqueData.length}`);
    
    // Show summary of uploaded words
    console.log('\n📝 Words uploaded:');
    uniqueData.forEach((word, index) => {
      console.log(`${index + 1}. ${word.word}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

// Run the upload
console.log('🚀 Starting vocabulary upload...');
uploadVocabulary();
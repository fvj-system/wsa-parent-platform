import { normalizeSubjectName, type MarylandSubject } from "@/lib/compliance/marylandSubjects";
import type { WorksheetPayload, WorksheetQuestion, WorksheetSection } from "@/lib/premium/types";

export type WorksheetSupportLevel = "supported" | "on_level" | "stretch";
export type WorksheetGradeBand = "K-2" | "3-5" | "6-8" | "9-12";

type CurriculumLessonContext = {
  questionCount: number;
  supportLevel: WorksheetSupportLevel;
  gradeBand: WorksheetGradeBand;
  mathLevel: string;
};

type CurriculumLesson = {
  title: string;
  essentialQuestion: string;
  learningObjective: string;
  hook: string;
  miniLesson: string;
  vocabulary: string[];
  mission: string;
  reflection: string;
  materials: string[];
  buildQuestions: (context: CurriculumLessonContext) => WorksheetQuestion[];
  extensionActivity: string;
};

type CurriculumTrack = {
  id: string;
  subject: MarylandSubject;
  title: string;
  unitTitle: string;
  description: string;
  funTheme: string;
  skills: string[];
  lessons: CurriculumLesson[];
};

export type WorksheetCurriculumOverview = {
  id: string;
  subject: MarylandSubject;
  title: string;
  unitTitle: string;
  description: string;
  funTheme: string;
  skills: string[];
  lessonCount: number;
};

type CurriculumWorksheetInput = {
  studentName: string;
  subject: string;
  gradeLevel: string;
  readingLevel: string;
  mathLevel: string;
  questionCount: number;
  supportLevel: WorksheetSupportLevel;
  existingWorksheetCount: number;
};

function clampQuestionCount(value: number) {
  return Math.max(5, Math.min(10, value));
}

function limitQuestions(questions: WorksheetQuestion[], count: number) {
  return questions.slice(0, clampQuestionCount(count)).map((question, index) => ({
    ...question,
    number: index + 1,
  }));
}

function getGradeBand(gradeLevel: string): WorksheetGradeBand {
  const normalized = gradeLevel.trim().toLowerCase();

  if (normalized === "kindergarten" || normalized === "k" || normalized === "1" || normalized === "2") {
    return "K-2";
  }

  const numeric = Number.parseInt(normalized, 10);
  if (!Number.isNaN(numeric)) {
    if (numeric <= 2) return "K-2";
    if (numeric <= 5) return "3-5";
    if (numeric <= 8) return "6-8";
    return "9-12";
  }

  if (normalized.includes("elementary")) return "3-5";
  if (normalized.includes("middle")) return "6-8";
  if (normalized.includes("high")) return "9-12";
  return "3-5";
}

function resolveSupportLevel(value: string): WorksheetSupportLevel {
  const normalized = value.trim().toLowerCase();

  if (["supported", "support", "gentle", "easy"].includes(normalized)) return "supported";
  if (["stretch", "challenge", "hard", "advanced"].includes(normalized)) return "stretch";
  return "on_level";
}

function getCoachBullets(supportLevel: WorksheetSupportLevel, readingLevel: string) {
  if (supportLevel === "supported") {
    return [
      "Read directions aloud once, then ask the student to explain the task back in their own words.",
      "Let the student answer orally first before writing.",
      `Keep writing chunks short and use sentence frames if the student is still developing at ${readingLevel}.`,
    ];
  }

  if (supportLevel === "stretch") {
    return [
      "Ask for evidence, complete sentences, and one extra detail on every short answer.",
      "Invite the student to defend an answer if more than one idea seems possible.",
      "Use the bonus challenge as required work instead of optional enrichment.",
    ];
  }

  return [
    "Model the first question, then release the rest to independent work.",
    "Ask, 'How do you know?' after each written response.",
    "Save one strong response or photo of the finished page as portfolio evidence.",
  ];
}

function buildSections(input: {
  lesson: CurriculumLesson;
  supportLevel: WorksheetSupportLevel;
  readingLevel: string;
}): WorksheetSection[] {
  return [
    {
      title: "Launch",
      kind: "hook",
      body: input.lesson.hook,
    },
    {
      title: "Mini Lesson",
      kind: "mini_lesson",
      body: input.lesson.miniLesson,
    },
    {
      title: "Word Bank",
      kind: "word_bank",
      body: "Use these words as you speak, label, and write.",
      bullets: input.lesson.vocabulary,
    },
    {
      title: "Mission",
      kind: "mission",
      body: input.lesson.mission,
    },
    {
      title: "Family Coach Note",
      kind: "coach_note",
      body: "Use the level supports below to keep the worksheet instructional without taking over the thinking.",
      bullets: getCoachBullets(input.supportLevel, input.readingLevel),
    },
    {
      title: "Reflection",
      kind: "reflection",
      body: input.lesson.reflection,
    },
  ];
}

function supportedHint(frame: string, supportLevel: WorksheetSupportLevel) {
  return supportLevel === "supported" ? frame : undefined;
}

function getMathFocus(mathLevel: string) {
  const normalized = mathLevel.trim().toLowerCase();

  if (["pre_k", "counting", "addition_subtraction"].includes(normalized)) return "early_arithmetic";
  if (["place_value", "multiplication_division"].includes(normalized)) return "operations";
  if (["fractions", "pre_algebra"].includes(normalized)) return "fractions_pre_algebra";
  if (["algebra", "geometry"].includes(normalized)) return "algebra_geometry";
  return "operations";
}

function englishQuestionsOne(context: CurriculumLessonContext) {
  const source =
    context.gradeBand === "K-2"
      ? "Maya carried a notebook on the trail. When she saw tiny tracks near the creek, she knelt down, sketched the shape, and whispered, 'I think something visited before breakfast.'"
      : "Maya tucked her notebook under one arm as she followed the muddy trail. A row of tiny tracks curved toward the creek, and she grinned. 'A careful observer always finds the first clue,' she said before sketching the prints.";

  return limitQuestions(
    [
      {
        number: 1,
        prompt: `Read this clue text: "${source}" What does the reader learn first about Maya?`,
        type: "multiple_choice",
        choices: [
          "She likes observing details outdoors.",
          "She is afraid of the creek.",
          "She forgot her notebook at home.",
          "She is racing another hiker.",
        ],
        answer: "She likes observing details outdoors.",
      },
      {
        number: 2,
        prompt: "Underline one word or phrase that helps you picture the setting. Then explain what it tells you.",
        type: "short_answer",
        answer: "Possible answer: 'muddy trail' or 'near the creek' because it shows the story happens outside on a damp trail.",
        hint: supportedHint("Sentence frame: The phrase ___ shows the setting because ___.", context.supportLevel),
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "What character trait fits Maya best in this passage?",
        type: "multiple_choice",
        choices: ["Curious", "Careless", "Sleepy", "Rude"],
        answer: "Curious",
      },
      {
        number: 4,
        prompt: "What is the problem or puzzle Maya wants to solve?",
        type: "short_answer",
        answer: "She wants to figure out what animal left the tracks.",
        hint: supportedHint("Sentence frame: Maya wants to find out ___.", context.supportLevel),
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Copy a vivid sentence or phrase from the passage. Circle one strong verb.",
        type: "copywork",
        answer: "Possible answers include 'followed,' 'curved,' 'grinned,' or 'sketching.'",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Retell the passage in order using first, next, and then.",
        type: "short_answer",
        answer: "Possible retell: First Maya walked the trail. Next she noticed tracks by the creek. Then she sketched them and realized they were an important clue.",
        hint: supportedHint("Use this frame: First ___. Next ___. Then ___.", context.supportLevel),
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Why does Maya smile before sketching the tracks? Use evidence from the text.",
        type: "short_answer",
        answer: "She smiles because she enjoys solving outdoor mysteries and notices that the tracks are an exciting clue.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function englishQuestionsTwo(context: CurriculumLessonContext) {
  const passage =
    "By lunch, the class had three ideas about the mystery tracks. Eli thought they came from a rabbit. Sofia pointed out the long claw marks and argued for a raccoon. Maya compared the sketches to the field guide and noticed the front prints were shaped like little hands.";

  return limitQuestions(
    [
      {
        number: 1,
        prompt: `Read the passage: "${passage}" What are the students trying to determine?`,
        type: "short_answer",
        answer: "They are trying to determine which animal made the tracks.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Which detail is the strongest piece of evidence for Maya's idea?",
        type: "multiple_choice",
        choices: [
          "It was almost lunchtime.",
          "The prints looked like little hands.",
          "Eli spoke first.",
          "The class had three ideas.",
        ],
        answer: "The prints looked like little hands.",
      },
      {
        number: 3,
        prompt: "Complete the comparison: Eli used a guess, but Maya used ___.",
        type: "short_answer",
        answer: "evidence from the sketch and the field guide",
        hint: supportedHint("Sentence frame: Maya used ___ to support her idea.", context.supportLevel),
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "What is the likely solution to the mystery? Explain why.",
        type: "short_answer",
        answer: "A raccoon is the likely solution because the long claw marks and hand-shaped prints match that animal best.",
        workspace_lines: 4,
      },
      {
        number: 5,
        prompt: "Write one sentence that tells the lesson of this reading.",
        type: "short_answer",
        answer: "Possible answers: Good readers and scientists use evidence, not just guesses. Careful observation leads to stronger conclusions.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "List two clues and match each clue to the claim it supports.",
        type: "match",
        choices: [
          "Long claw marks -> raccoon",
          "Hand-shaped front prints -> raccoon",
          "Quick first idea -> guess",
        ],
        answer: "The two strongest clues both support the raccoon claim.",
      },
      {
        number: 7,
        prompt: "Write a stronger ending sentence for the passage that shows how Maya's evidence changed the group's thinking.",
        type: "short_answer",
        answer: "Possible answer: After checking the field guide, the class agreed that the tracks almost certainly belonged to a raccoon.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function englishQuestionsThree(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "A writer wants the reader to feel the quiet of an early morning hike. Which detail would work best?",
        type: "multiple_choice",
        choices: [
          "The sky blinked awake while dew held to every blade of grass.",
          "There were many things outside.",
          "The family walked somewhere nice.",
          "It was a good day for moving.",
        ],
        answer: "The sky blinked awake while dew held to every blade of grass.",
      },
      {
        number: 2,
        prompt: "Explain why the best detail above is more vivid than the other choices.",
        type: "short_answer",
        answer: "It uses precise words and imagery to help the reader see and feel the scene.",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Rewrite this plain sentence so it sounds more descriptive: 'The bird sat on the branch.'",
        type: "short_answer",
        answer: "Possible answer: The bright red bird balanced on the thin branch and flicked its tail.",
        workspace_lines: 4,
      },
      {
        number: 4,
        prompt: "Circle one sensory detail you included in your new sentence and label it sight, sound, touch, smell, or taste.",
        type: "short_answer",
        answer: "Answers vary. Students should identify a real sensory detail and label it correctly.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Write a two-sentence nature journal entry. Sentence one should tell what you noticed. Sentence two should tell why it mattered.",
        type: "short_answer",
        answer: "Answers vary, but both sentences should connect observation to meaning.",
        hint: supportedHint("Use: I noticed ___. This mattered because ___.", context.supportLevel),
        workspace_lines: 5,
      },
      {
        number: 6,
        prompt: "Copy your strongest sentence neatly and underline the most precise noun.",
        type: "copywork",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Add one more sentence that creates mood without naming the feeling directly.",
        type: "short_answer",
        answer: "Answers vary, but should imply mood through detail.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function mathQuestionsOne(context: CurriculumLessonContext) {
  const focus = getMathFocus(context.mathLevel);

  if (focus === "early_arithmetic") {
    return limitQuestions(
      [
        {
          number: 1,
          prompt: "A pack has 7 trail markers. Another pack has 5. How many markers are there in all?",
          type: "math",
          answer: "12",
          workspace_lines: 2,
        },
        {
          number: 2,
          prompt: "12 markers were set out. 4 were used on the first path. How many are left?",
          type: "math",
          answer: "8",
          workspace_lines: 2,
        },
        {
          number: 3,
          prompt: "Write two different number sentences that make 15.",
          type: "math",
          answer: "Possible answers: 10 + 5 = 15 and 9 + 6 = 15.",
          workspace_lines: 3,
        },
        {
          number: 4,
          prompt: "Circle the greater number: 18 or 21. Then explain how you know.",
          type: "math",
          answer: "21 because it has 2 tens while 18 has 1 ten.",
          workspace_lines: 2,
        },
        {
          number: 5,
          prompt: "Draw quick tens and ones for the number 24.",
          type: "draw",
          answer: "2 tens and 4 ones",
          workspace_lines: 3,
        },
        {
          number: 6,
          prompt: "Solve: 9 + 8 = ___. Show a strategy such as make a ten, counting on, or doubles.",
          type: "math",
          answer: "17",
          workspace_lines: 3,
        },
        {
          number: 7,
          prompt: "Challenge: Make up your own trail-supply addition problem with an answer of 14.",
          type: "math",
          answer: "Answers vary.",
          workspace_lines: 3,
        },
      ],
      context.questionCount,
    );
  }

  if (focus === "fractions_pre_algebra") {
    return limitQuestions(
      [
        {
          number: 1,
          prompt: "A hiking team walked 3/4 of a mile in the morning and 1/4 of a mile after lunch. How far did they walk altogether?",
          type: "math",
          answer: "1 mile",
          workspace_lines: 3,
        },
        {
          number: 2,
          prompt: "Solve: 5 x 6 + 8. Show the order you used.",
          type: "math",
          answer: "38",
          workspace_lines: 3,
        },
        {
          number: 3,
          prompt: "A map scale says 1 inch = 2 miles. How many miles does 4.5 inches represent?",
          type: "math",
          answer: "9 miles",
          workspace_lines: 3,
        },
        {
          number: 4,
          prompt: "Write an expression for: '7 fewer than three times n.'",
          type: "math",
          answer: "3n - 7",
          workspace_lines: 2,
        },
        {
          number: 5,
          prompt: "Solve the equation: x + 9 = 23.",
          type: "math",
          answer: "14",
          workspace_lines: 2,
        },
        {
          number: 6,
          prompt: "A cooler is filled to 2/3 of its space. If the full cooler holds 18 bottles, how many bottles are inside now?",
          type: "math",
          answer: "12",
          workspace_lines: 3,
        },
        {
          number: 7,
          prompt: "Challenge: Explain why 3/4 + 1/4 makes a whole using words, numbers, or a sketch.",
          type: "short_answer",
          answer: "The fractions have the same denominator, so 3 parts + 1 part = 4 fourths, which is 1 whole.",
          workspace_lines: 4,
        },
      ],
      context.questionCount,
    );
  }

  if (focus === "algebra_geometry") {
    return limitQuestions(
      [
        {
          number: 1,
          prompt: "A trail map charges y dollars for admission plus a 6 dollar parking fee. Write the total cost expression.",
          type: "math",
          answer: "y + 6",
          workspace_lines: 2,
        },
        {
          number: 2,
          prompt: "Solve: 4x - 3 = 21.",
          type: "math",
          answer: "6",
          workspace_lines: 3,
        },
        {
          number: 3,
          prompt: "A rectangular garden is 8 feet by 5 feet. Find the area and perimeter.",
          type: "math",
          answer: "Area = 40 square feet. Perimeter = 26 feet.",
          workspace_lines: 3,
        },
        {
          number: 4,
          prompt: "The ratio of red flags to blue flags is 3:5. If there are 15 blue flags, how many red flags are there?",
          type: "math",
          answer: "9",
          workspace_lines: 3,
        },
        {
          number: 5,
          prompt: "Evaluate 2a + 7 when a = 9.",
          type: "math",
          answer: "25",
          workspace_lines: 2,
        },
        {
          number: 6,
          prompt: "Explain one real way algebra helps a trail planner make decisions.",
          type: "short_answer",
          answer: "Possible answers: estimating cost, distance, time, supplies, or layout measurements.",
          workspace_lines: 3,
        },
        {
          number: 7,
          prompt: "Challenge: Write and solve your own one-step or two-step trail-planning equation.",
          type: "math",
          answer: "Answers vary.",
          workspace_lines: 4,
        },
      ],
      context.questionCount,
    );
  }

  return limitQuestions(
    [
      {
        number: 1,
        prompt: "A camp table has 4 rows of 6 lanterns. How many lanterns are there?",
        type: "math",
        answer: "24",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "A trail is 247 meters long. Another trail is 138 meters long. How much longer is the first trail?",
        type: "math",
        answer: "109 meters",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Write 4,306 in expanded form.",
        type: "math",
        answer: "4,000 + 300 + 6",
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "There are 36 field guides shared equally among 9 students. How many guides does each student get?",
        type: "math",
        answer: "4",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Round 487 to the nearest hundred.",
        type: "math",
        answer: "500",
        workspace_lines: 2,
      },
      {
        number: 6,
        prompt: "Solve: 18 x 3.",
        type: "math",
        answer: "54",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Create a two-step story problem about camp supplies and solve it.",
        type: "math",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function mathQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Measure a book, pencil, or leaf with inches or centimeters. Record the length and unit.",
        type: "math",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "A water bottle holds 16 ounces. Two bottles are filled. How many ounces is that altogether?",
        type: "math",
        answer: "32 ounces",
        workspace_lines: 2,
      },
      {
        number: 3,
        prompt: "The class recorded these bird sightings: robin 4, blue jay 2, cardinal 5. Which bird was seen most? How many sightings in all?",
        type: "math",
        answer: "Cardinal; 11 sightings in all",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "A walk started at 9:10 and ended at 9:45. How many minutes did it last?",
        type: "math",
        answer: "35 minutes",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Choose an object in the room. Estimate its length first, then measure it. Which was greater: your estimate or the actual measurement?",
        type: "math",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Explain why labels and units matter when we collect data.",
        type: "short_answer",
        answer: "Units and labels tell what is being measured and make the data understandable.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Make a quick bar graph of the bird-sighting data and write one thing it shows clearly.",
        type: "draw",
        answer: "A correct graph and a reasonable statement about the data.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function mathQuestionsThree(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "A family packed 3 snacks for each of 4 hikers and 2 extra snacks. Write an equation and solve.",
        type: "math",
        answer: "3 x 4 + 2 = 14",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "A trail loop is 2 miles. If a family walks it 3 times, how many miles is that?",
        type: "math",
        answer: "6 miles",
        workspace_lines: 2,
      },
      {
        number: 3,
        prompt: "The class needs 48 crayons for art kits. Boxes come with 6 crayons each. How many boxes are needed?",
        type: "math",
        answer: "8 boxes",
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "If one side of a square garden is 9 feet, what is the perimeter?",
        type: "math",
        answer: "36 feet",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Write a rule for this pattern: 5, 8, 11, 14, ...",
        type: "short_answer",
        answer: "Add 3 each time.",
        workspace_lines: 2,
      },
      {
        number: 6,
        prompt: "Which strategy helped most today: drawing a model, writing an equation, or looking for a pattern? Explain.",
        type: "short_answer",
        answer: "Answers vary, but should name a real strategy and explain its value.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Write your own two-step real-world math problem and solve it.",
        type: "math",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function scienceQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "List three things a living thing needs to survive.",
        type: "short_answer",
        answer: "Possible answers: water, air, food, shelter, sunlight, space.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "A rabbit has long ears, strong back legs, and brown fur. Match each trait to how it helps the rabbit.",
        type: "match",
        choices: [
          "Long ears -> hear danger",
          "Strong back legs -> run and hop away",
          "Brown fur -> blend into the environment",
        ],
        answer: "Each body part should be matched to its survival job.",
      },
      {
        number: 3,
        prompt: "Why is shelter important in a habitat?",
        type: "short_answer",
        answer: "Shelter protects an animal from weather and predators and gives it a place to rest or raise young.",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "Draw one animal and label two structures that help it survive.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 5,
        prompt: "What might happen if clean water disappeared from a habitat?",
        type: "short_answer",
        answer: "Plants and animals would struggle to survive, move away, or die because water is a basic need.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Write one observation and one inference about an organism near you or in a picture.",
        type: "short_answer",
        answer: "Answers vary, but the observation should be directly seen and the inference should be a reasoned idea.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Challenge: Explain how one change in a habitat could affect more than one living thing.",
        type: "short_answer",
        answer: "Answers vary, but should show cause and effect in the habitat.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function scienceQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Name two pieces of weather data we can measure each day.",
        type: "short_answer",
        answer: "Possible answers: temperature, rainfall, wind, cloud cover.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "If the sky is dark, the wind picks up, and air feels cooler, what weather might come next?",
        type: "multiple_choice",
        choices: ["A storm or rain", "A heat wave", "A snow day indoors", "No change at all"],
        answer: "A storm or rain",
      },
      {
        number: 3,
        prompt: "Why do scientists track weather patterns over many days instead of one day?",
        type: "short_answer",
        answer: "Patterns become clearer over time, and one day alone does not show a trend.",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "Look outside or imagine today's sky. Record one observation about clouds and one prediction for later.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 5,
        prompt: "Match the tool to its job.",
        type: "match",
        choices: [
          "Thermometer -> measures temperature",
          "Rain gauge -> measures rainfall",
          "Windsock -> shows wind direction",
        ],
        answer: "Each tool should be matched to its weather job.",
      },
      {
        number: 6,
        prompt: "Write a safety choice that fits stormy weather.",
        type: "short_answer",
        answer: "Possible answers: go indoors, avoid tall trees, or wait until lightning passes.",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Design a three-day weather log table and explain what pattern you would watch for.",
        type: "draw",
        answer: "A simple table with dates and weather categories plus a clear pattern goal.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function scienceQuestionsThree(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Put these life cycle stages in order: adult, egg, young, pupa.",
        type: "short_answer",
        answer: "egg, young, pupa, adult",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "How is a life cycle a system?",
        type: "short_answer",
        answer: "The stages work together in a repeating sequence that helps a species continue.",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "What is one pattern you notice in many plant or animal life cycles?",
        type: "short_answer",
        answer: "Possible answers: things grow, change form, need resources, and eventually reproduce.",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "Draw a simple cycle diagram and label each stage clearly.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 5,
        prompt: "Why would missing one stage affect the whole cycle?",
        type: "short_answer",
        answer: "The cycle would be interrupted, so growth, survival, or reproduction could not happen correctly.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Compare a life cycle to another system you know, such as a schedule, machine, or routine.",
        type: "short_answer",
        answer: "Answers vary, but should show connected parts working in order.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Challenge: Predict one way season changes could affect a life cycle.",
        type: "short_answer",
        answer: "Possible answers: timing of hatching, flowering, migration, or food availability might change.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function socialStudiesQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Why do maps use symbols and labels?",
        type: "short_answer",
        answer: "Symbols and labels help readers understand places quickly and clearly.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "Draw a simple map of a room, yard, or short walking route. Include at least four labels.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 5,
      },
      {
        number: 3,
        prompt: "Add a compass rose and circle north on your map.",
        type: "draw",
        answer: "North should be clearly labeled.",
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "Which map feature helps a reader understand what symbols mean?",
        type: "multiple_choice",
        choices: ["Key or legend", "Title only", "Border only", "Color alone"],
        answer: "Key or legend",
      },
      {
        number: 5,
        prompt: "Write directions from one place on your map to another using words like left, right, north, south, near, or across from.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 6,
        prompt: "Why is map-reading an important community skill?",
        type: "short_answer",
        answer: "It helps people find places, give directions, plan routes, and stay organized.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Add one symbol to show something that changes during the day, such as traffic, shade, or noise, and explain it.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function socialStudiesQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Name one job people do in a community to help others.",
        type: "short_answer",
        answer: "Possible answers: teacher, firefighter, nurse, librarian, sanitation worker.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "How is a need different from a want?",
        type: "short_answer",
        answer: "A need is something necessary for living and safety. A want is something nice to have but not necessary.",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Sort these into needs or wants: clean water, bicycle, shelter, ice cream, healthy food.",
        type: "match",
        choices: [
          "Needs -> clean water, shelter, healthy food",
          "Wants -> bicycle, ice cream",
        ],
        answer: "Items should be sorted into the correct category.",
      },
      {
        number: 4,
        prompt: "Why do communities make rules?",
        type: "short_answer",
        answer: "Rules help people stay safe, work together, and solve problems fairly.",
        workspace_lines: 3,
      },
      {
        number: 5,
        prompt: "Choose one community helper and describe one problem they solve.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Write one rule that would help a shared learning space run better and explain why.",
        type: "short_answer",
        answer: "Answers vary, but the rule should connect to safety, fairness, or efficiency.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Challenge: Explain how one choice by a citizen can improve a whole community.",
        type: "short_answer",
        answer: "Answers vary, but should show a ripple effect such as voting, volunteering, or caring for shared spaces.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function socialStudiesQuestionsThree(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "A farmer grows apples. A truck driver moves them. A store sells them. What does this show about goods and services?",
        type: "short_answer",
        answer: "It shows that many people work together to move goods from producer to buyer.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "What is a producer?",
        type: "multiple_choice",
        choices: [
          "A person or business that makes or grows goods",
          "Someone who only buys goods",
          "A person who studies weather",
          "A kind of map symbol",
        ],
        answer: "A person or business that makes or grows goods",
      },
      {
        number: 3,
        prompt: "What is a consumer?",
        type: "short_answer",
        answer: "A consumer is a person who buys or uses goods and services.",
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "List one good and one service you used this week.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Why do transportation and communication matter in trade?",
        type: "short_answer",
        answer: "They help move goods, share information, and connect producers with consumers.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Draw a quick flow chart showing how one product gets from maker to family.",
        type: "draw",
        answer: "Answers vary, but should show a logical sequence.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Challenge: Explain one way local buying can affect a community.",
        type: "short_answer",
        answer: "Possible answers: it supports local jobs, keeps money in the area, or builds stronger community ties.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

function artQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Name three kinds of lines an artist can use to create movement or feeling.",
        type: "short_answer",
        answer: "Possible answers: straight, curved, zigzag, thick, thin, dashed.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Draw five different lines in separate spaces.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 3,
        prompt: "Which line would best show calm water?",
        type: "multiple_choice",
        choices: ["Soft curved lines", "Sharp zigzags", "Broken jagged lines", "Dark scribbles"],
        answer: "Soft curved lines",
      },
      {
        number: 4,
        prompt: "Create one object using only basic shapes.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 5,
        prompt: "Explain how your line choices changed the feeling of your drawing.",
        type: "short_answer",
        answer: "Answers vary, but should connect line style to mood or movement.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Write one artist promise for today: what will you slow down and notice?",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Add texture marks to one shape and label the texture word that fits best.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function artQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Choose a texture word: rough, smooth, fuzzy, bumpy, glossy. What object could match it?",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Draw a small object and use marks to show its texture.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 3,
        prompt: "What mood do warm colors often suggest?",
        type: "multiple_choice",
        choices: ["Energy or warmth", "Silence only", "No feeling at all", "Only sadness"],
        answer: "Energy or warmth",
      },
      {
        number: 4,
        prompt: "Name one cool color and one warm color.",
        type: "short_answer",
        answer: "Possible answers: blue and orange, green and red.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Design a tiny poster for a season using colors and texture marks to match the mood.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 6,
        prompt: "Explain one choice you made to help the viewer feel the season.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Add one contrasting color or texture and explain how it changes the design.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function musicQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "What is the difference between beat and rhythm?",
        type: "short_answer",
        answer: "Beat is the steady pulse. Rhythm is the pattern of sounds and silences over the beat.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "Tap or clap a steady beat for ten counts. Mark each count with a tally.",
        type: "draw",
        answer: "Ten tally marks",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Which pattern shows a rhythm instead of only a beat?",
        type: "multiple_choice",
        choices: ["ta ta ti-ti ta", "1 1 1 1", "tap tap tap tap", "step step step step"],
        answer: "ta ta ti-ti ta",
      },
      {
        number: 4,
        prompt: "Write a four-beat pattern using words, symbols, or syllables.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "How can your body help you keep a beat steady?",
        type: "short_answer",
        answer: "Possible answers: tap a foot, clap, pat legs, or sway evenly.",
        workspace_lines: 2,
      },
      {
        number: 6,
        prompt: "Invent a short rhythm for a rainstorm and perform it.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Combine two different rhythm patterns into an eight-beat phrase.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function musicQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Why do repeated patterns help listeners follow music?",
        type: "short_answer",
        answer: "Patterns help listeners predict, remember, and feel the structure of the music.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "Create an A-B rhythm pattern. Write part A and part B.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Which pair shows contrast?",
        type: "multiple_choice",
        choices: ["loud then soft", "same then same", "fast then fast", "clap then clap"],
        answer: "loud then soft",
      },
      {
        number: 4,
        prompt: "Add one body percussion move to part A and a different one to part B.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Explain how your pattern changes from beginning to end.",
        type: "short_answer",
        answer: "Answers vary, but should describe contrast or repetition.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Perform your pattern twice. What improved the second time?",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Add a rest or silence in one spot and explain why it helps the pattern.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function healthQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "List one habit that helps your body stay healthy each day.",
        type: "short_answer",
        answer: "Possible answers: sleep, movement, water, healthy food, hygiene.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Which choice is a balanced snack?",
        type: "multiple_choice",
        choices: ["Apple slices and peanut butter", "Only candy", "Only soda", "Nothing after exercise"],
        answer: "Apple slices and peanut butter",
      },
      {
        number: 3,
        prompt: "Why is drinking water important when you move your body?",
        type: "short_answer",
        answer: "Water helps the body stay hydrated and work well during movement.",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "Write a mini healthy-day plan with one food choice, one movement choice, and one rest choice.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
      {
        number: 5,
        prompt: "How can sleep affect mood and learning?",
        type: "short_answer",
        answer: "Sleep helps focus, memory, patience, and body recovery.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Circle one habit you want to strengthen this week and explain why.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Design a reminder card for one healthy habit.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function healthQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Name one body signal that tells you to slow down or ask for help.",
        type: "short_answer",
        answer: "Possible answers: dizziness, pain, trouble breathing, strong fear.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Which adult should you go to first if you feel unsafe in a public place?",
        type: "multiple_choice",
        choices: ["A trusted adult or staff member", "No one", "Only another child", "Someone far away who is not paying attention"],
        answer: "A trusted adult or staff member",
      },
      {
        number: 3,
        prompt: "Why is it important to know your full name, caregiver name, and a phone number?",
        type: "short_answer",
        answer: "It helps adults contact the right person and keep you safe if you need help.",
        workspace_lines: 3,
      },
      {
        number: 4,
        prompt: "Write one rule for bike, trail, or playground safety.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "What should you do before taking medicine or trying something risky?",
        type: "short_answer",
        answer: "Ask a trusted adult and follow safety rules.",
        workspace_lines: 2,
      },
      {
        number: 6,
        prompt: "Create a three-step plan for what to do if you get separated from your group.",
        type: "short_answer",
        answer: "Possible answers: stop, stay visible, find a trusted adult or worker, share needed information.",
        workspace_lines: 4,
      },
      {
        number: 7,
        prompt: "Challenge: Explain how calm breathing can help you make safer choices.",
        type: "short_answer",
        answer: "It helps the brain slow down, think clearly, and choose next steps safely.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function peQuestionsOne(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "Name two locomotor movements.",
        type: "short_answer",
        answer: "Possible answers: walk, run, hop, jump, skip, gallop.",
        workspace_lines: 2,
      },
      {
        number: 2,
        prompt: "Balance on one foot for ten seconds. Which body parts helped you stay steady?",
        type: "short_answer",
        answer: "Possible answers: arms, core, eyes, planted foot.",
        workspace_lines: 3,
      },
      {
        number: 3,
        prompt: "Which activity best builds coordination?",
        type: "multiple_choice",
        choices: ["A hop-jump-clap pattern", "Sitting still", "Only watching others", "Skipping warm-up every time"],
        answer: "A hop-jump-clap pattern",
      },
      {
        number: 4,
        prompt: "Draw or describe a short movement pattern with three steps.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 5,
        prompt: "Why do warm-ups matter before vigorous activity?",
        type: "short_answer",
        answer: "Warm-ups prepare muscles and joints and lower injury risk.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "What was hardest today: balance, speed, or control? Explain.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
      {
        number: 7,
        prompt: "Challenge: Create a new movement combo and teach it to someone else.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 3,
      },
    ],
    context.questionCount,
  );
}

function peQuestionsTwo(context: CurriculumLessonContext) {
  return limitQuestions(
    [
      {
        number: 1,
        prompt: "How can you tell your heart is working harder during exercise?",
        type: "short_answer",
        answer: "Possible answers: faster heartbeat, warmer body, heavier breathing, sweating.",
        workspace_lines: 3,
      },
      {
        number: 2,
        prompt: "What is endurance?",
        type: "multiple_choice",
        choices: [
          "The ability to keep going during activity",
          "Only being the fastest",
          "Never needing rest",
          "Winning every game",
        ],
        answer: "The ability to keep going during activity",
      },
      {
        number: 3,
        prompt: "List one way to pace yourself during a walk, jog, or circuit.",
        type: "short_answer",
        answer: "Possible answers: start steady, breathe evenly, take planned breaks, keep a rhythm.",
        workspace_lines: 2,
      },
      {
        number: 4,
        prompt: "Record one active task you can do for 5 to 10 minutes at home or outside.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 5,
        prompt: "Why is recovery time important after hard movement?",
        type: "short_answer",
        answer: "Recovery helps the body cool down, breathe normally, and stay ready for the next activity.",
        workspace_lines: 3,
      },
      {
        number: 6,
        prompt: "Write one personal movement goal for this week.",
        type: "short_answer",
        answer: "Answers vary.",
        workspace_lines: 2,
      },
      {
        number: 7,
        prompt: "Challenge: Design a mini 4-station movement circuit and explain what each station builds.",
        type: "draw",
        answer: "Answers vary.",
        workspace_lines: 4,
      },
    ],
    context.questionCount,
  );
}

const worksheetTracks: CurriculumTrack[] = [
  {
    id: "english-story-detectives",
    subject: "English",
    title: "Story Detectives",
    unitTitle: "Reading for Clues and Strong Writing",
    description: "Students read like detectives, collect evidence, and write with stronger detail.",
    funTheme: "Mystery clues, field notes, and writer missions",
    skills: ["reading comprehension", "evidence", "retell", "descriptive writing"],
    lessons: [
      {
        title: "Character Clues",
        essentialQuestion: "How do details help us understand a character?",
        learningObjective: "I can use story clues to describe a character and retell events in order.",
        hook: "Today you are a story detective. Your job is to notice what a character says, does, and chooses.",
        miniLesson: "Strong readers slow down for clues. A clue can show character traits, setting, and the problem the character wants to solve.",
        vocabulary: ["clue", "character trait", "setting", "retell", "evidence"],
        mission: "Read the short passage, gather clues, and solve what the text teaches you about Maya.",
        reflection: "Which clue helped you most today, and why?",
        materials: ["pencil", "optional colored pencil for underlining clues"],
        buildQuestions: englishQuestionsOne,
        extensionActivity: "Read a favorite book page and list three more character clues from it.",
      },
      {
        title: "Evidence Wins",
        essentialQuestion: "How do readers use evidence to support an idea?",
        learningObjective: "I can choose strong text evidence and explain how it supports a claim.",
        hook: "Good thinkers do not stop at a guess. They look for the strongest clue.",
        miniLesson: "A claim is stronger when we connect it to a specific detail from the text instead of a feeling or fast guess.",
        vocabulary: ["claim", "evidence", "solution", "infer", "field guide"],
        mission: "Study the mystery-track debate and decide which explanation deserves the strongest support.",
        reflection: "What makes evidence stronger than a guess?",
        materials: ["pencil"],
        buildQuestions: englishQuestionsTwo,
        extensionActivity: "Ask the student to defend one answer aloud using the phrase 'My evidence is...'",
      },
      {
        title: "Writer's Lens",
        essentialQuestion: "How can a writer help the reader feel the moment?",
        learningObjective: "I can revise plain sentences into stronger, more descriptive writing.",
        hook: "Writers are not just telling what happened. They are helping the reader see it.",
        miniLesson: "Precise nouns, vivid verbs, and sensory details make a sentence feel alive.",
        vocabulary: ["sensory detail", "mood", "precise noun", "revise", "imagery"],
        mission: "Turn plain sentences into a small field-journal moment the reader can picture.",
        reflection: "Which word choice made your writing stronger today?",
        materials: ["pencil", "optional nature photo or outdoor object"],
        buildQuestions: englishQuestionsThree,
        extensionActivity: "Take a five-minute outdoor observation break and add one more journal entry later.",
      },
    ],
  },
  {
    id: "mathematics-trail-math",
    subject: "Mathematics",
    title: "Trail Math",
    unitTitle: "Real-World Problem Solving",
    description: "Students practice number sense, measurement, and problem solving through outdoor and everyday scenarios.",
    funTheme: "Supply packs, maps, data, and challenge trails",
    skills: ["operations", "measurement", "data", "problem solving"],
    lessons: [
      {
        title: "Supply Pack Numbers",
        essentialQuestion: "How can math help us make smart decisions with supplies and plans?",
        learningObjective: "I can solve real-world number problems and show my strategy.",
        hook: "Every adventure needs a sharp math planner.",
        miniLesson: "When you face a real problem, first decide what the question is asking, then choose a useful strategy such as drawing, grouping, or writing an equation.",
        vocabulary: ["strategy", "equation", "sum", "difference", "model"],
        mission: "Solve the supply-pack problems and explain your thinking like a trail planner.",
        reflection: "Which strategy helped you most today?",
        materials: ["pencil", "optional counters or scratch paper"],
        buildQuestions: mathQuestionsOne,
        extensionActivity: "Build one new supply problem from home objects and solve it with a picture.",
      },
      {
        title: "Measure and Record",
        essentialQuestion: "Why do accurate measurement and data collection matter?",
        learningObjective: "I can measure, compare, and describe data clearly.",
        hook: "Scientists and builders trust measurements because guesses can only take you so far.",
        miniLesson: "Measurement answers need both a number and a unit. Data becomes useful when it is organized, labeled, and compared.",
        vocabulary: ["estimate", "unit", "data", "compare", "graph"],
        mission: "Measure, record, and analyze the sample data like a field researcher.",
        reflection: "How did a label or unit change the meaning of your answer?",
        materials: ["pencil", "ruler or measuring tape if available"],
        buildQuestions: mathQuestionsTwo,
        extensionActivity: "Measure three more objects and order them from shortest to longest.",
      },
      {
        title: "Challenge Trail",
        essentialQuestion: "How do patterns and equations help solve bigger problems?",
        learningObjective: "I can represent a multi-step situation with math and justify my answer.",
        hook: "A challenge trail has more than one step, so your thinking needs a plan.",
        miniLesson: "Look for what repeats, decide what operation fits each part, and keep track of intermediate answers before jumping to a final result.",
        vocabulary: ["pattern", "perimeter", "multi-step", "rule", "justify"],
        mission: "Complete the challenge trail and prove that your solution makes sense.",
        reflection: "How did breaking the task into parts help you?",
        materials: ["pencil"],
        buildQuestions: mathQuestionsThree,
        extensionActivity: "Invite the student to teach one solved problem step by step to someone else.",
      },
    ],
  },
  {
    id: "science-habitat-detectives",
    subject: "Science",
    title: "Habitat Detectives",
    unitTitle: "Observation, Patterns, and Systems",
    description: "Students study living things, weather, and cycles through observation-rich science tasks.",
    funTheme: "Nature clues, weather tools, and system diagrams",
    skills: ["observation", "patterns", "systems", "cause and effect"],
    lessons: [
      {
        title: "Habitat Needs",
        essentialQuestion: "What helps living things survive where they live?",
        learningObjective: "I can describe how structures and habitat resources support survival.",
        hook: "A habitat is more than a place. It is a survival system.",
        miniLesson: "Living things need resources, and their body structures help them use those resources in smart ways.",
        vocabulary: ["habitat", "structure", "resource", "shelter", "adaptation"],
        mission: "Investigate the habitat clues and explain how an organism is built to survive.",
        reflection: "Which structure-to-function match felt most important today?",
        materials: ["pencil"],
        buildQuestions: scienceQuestionsOne,
        extensionActivity: "Go outside and sketch one living thing with labels for survival features.",
      },
      {
        title: "Weather Watch",
        essentialQuestion: "How do observations help us predict weather?",
        learningObjective: "I can use weather clues and simple data to make a prediction.",
        hook: "Meteorologists are pattern finders.",
        miniLesson: "Weather changes can be described, measured, and compared. Prediction becomes stronger when it is based on multiple clues.",
        vocabulary: ["pattern", "prediction", "temperature", "cloud cover", "tool"],
        mission: "Read the weather signs, record data, and make a smart next-step prediction.",
        reflection: "What clue made your weather prediction stronger?",
        materials: ["pencil", "optional outdoor view"],
        buildQuestions: scienceQuestionsTwo,
        extensionActivity: "Start a real three-day weather log and compare predictions to outcomes.",
      },
      {
        title: "Cycles and Systems",
        essentialQuestion: "How do connected stages keep a natural system going?",
        learningObjective: "I can explain how parts of a cycle work together over time.",
        hook: "In nature, many important changes happen in a loop rather than a straight line.",
        miniLesson: "A system is made of connected parts. When the order matters, the whole cycle depends on each stage doing its job.",
        vocabulary: ["cycle", "stage", "system", "sequence", "pattern"],
        mission: "Map a natural cycle and explain what happens if one part changes.",
        reflection: "Which stage seemed most connected to the others?",
        materials: ["pencil"],
        buildQuestions: scienceQuestionsThree,
        extensionActivity: "Build a paper wheel or diagram to show a cycle from memory.",
      },
    ],
  },
  {
    id: "social-studies-map-makers",
    subject: "Social Studies",
    title: "Map Makers Guild",
    unitTitle: "Community, Geography, and Civic Thinking",
    description: "Students connect maps, helpers, rules, and trade to everyday life.",
    funTheme: "Maps, routes, helpers, and community problem solving",
    skills: ["geography", "civics", "economics", "communication"],
    lessons: [
      {
        title: "Map the Space",
        essentialQuestion: "How do maps help people understand and move through spaces?",
        learningObjective: "I can use labels, symbols, and directions to create a useful map.",
        hook: "A great map-maker thinks about what another person needs in order to follow the route.",
        miniLesson: "Maps use symbols, labels, titles, and direction words so that a space can be understood without being physically present.",
        vocabulary: ["map", "legend", "symbol", "compass rose", "route"],
        mission: "Design a small but useful map that another person could actually follow.",
        reflection: "What feature made your map easier to read?",
        materials: ["pencil"],
        buildQuestions: socialStudiesQuestionsOne,
        extensionActivity: "Take a family walk and narrate directions out loud using map words.",
      },
      {
        title: "Rules and Helpers",
        essentialQuestion: "Why do communities depend on helpers and shared rules?",
        learningObjective: "I can explain how needs, rules, and helpers support community life.",
        hook: "Communities work best when people understand both responsibility and care.",
        miniLesson: "Helpers solve specific problems, and rules help large groups stay safe and fair.",
        vocabulary: ["community", "need", "want", "citizen", "responsibility"],
        mission: "Study community needs and propose choices that help everyone function better.",
        reflection: "Which rule or helper seemed most essential today?",
        materials: ["pencil"],
        buildQuestions: socialStudiesQuestionsTwo,
        extensionActivity: "Interview a family member about one community rule they appreciate now.",
      },
      {
        title: "Goods on the Move",
        essentialQuestion: "How do goods and services move through a community?",
        learningObjective: "I can describe how producers, consumers, and transportation connect.",
        hook: "Most things we use have traveled through many hands before reaching us.",
        miniLesson: "Economics becomes easier to understand when we track who makes, moves, sells, and uses an item.",
        vocabulary: ["producer", "consumer", "good", "service", "trade"],
        mission: "Trace one product journey and explain who helped along the way.",
        reflection: "What step in the journey surprised you?",
        materials: ["pencil"],
        buildQuestions: socialStudiesQuestionsThree,
        extensionActivity: "Choose one item at home and build a fuller product journey poster later.",
      },
    ],
  },
  {
    id: "art-studio-explorers",
    subject: "Art",
    title: "Studio Explorers",
    unitTitle: "Line, Shape, Color, and Texture",
    description: "Students create with clear visual goals and artist reflection built into the page.",
    funTheme: "Sketch missions and mini studio challenges",
    skills: ["observation", "design", "texture", "reflection"],
    lessons: [
      {
        title: "Line and Shape Lab",
        essentialQuestion: "How do line and shape change what a viewer notices?",
        learningObjective: "I can use line and shape intentionally to create a simple design.",
        hook: "Artists do not wait for inspiration. They practice seeing and choosing.",
        miniLesson: "Different lines create different movement and mood. Shapes help organize space and build recognizable forms.",
        vocabulary: ["line", "shape", "movement", "contrast", "design"],
        mission: "Complete the line and shape tasks, then turn them into a tiny original design.",
        reflection: "Which line choice changed your drawing the most?",
        materials: ["pencil", "crayons or colored pencils if available"],
        buildQuestions: artQuestionsOne,
        extensionActivity: "Collect three household objects and sketch them using only contour lines.",
      },
      {
        title: "Texture and Mood",
        essentialQuestion: "How do texture and color help tell the viewer how something feels?",
        learningObjective: "I can use marks and color choices to create a clear mood.",
        hook: "A strong artwork does not only show an object. It suggests a feeling.",
        miniLesson: "Texture can be real or implied. Color temperature and contrast help direct emotional tone.",
        vocabulary: ["texture", "warm color", "cool color", "mood", "contrast"],
        mission: "Build a seasonal or mood-based design that makes the viewer feel something specific.",
        reflection: "What artistic choice carried the most emotion in your work?",
        materials: ["pencil", "crayons or colored pencils if available"],
        buildQuestions: artQuestionsTwo,
        extensionActivity: "Create a second color version of the same design and compare the mood shift.",
      },
    ],
  },
  {
    id: "music-rhythm-rangers",
    subject: "Music",
    title: "Rhythm Rangers",
    unitTitle: "Beat, Pattern, and Performance",
    description: "Students move, clap, write, and reflect on core rhythm ideas.",
    funTheme: "Body percussion and pattern building",
    skills: ["beat", "rhythm", "pattern", "performance"],
    lessons: [
      {
        title: "Beat and Rhythm",
        essentialQuestion: "How are beat and rhythm connected but different?",
        learningObjective: "I can keep a steady beat and create a short rhythm pattern.",
        hook: "Musicians feel the beat in their body even before they write anything down.",
        miniLesson: "The beat stays steady. Rhythm changes shape across the beat. Knowing the difference helps music feel organized.",
        vocabulary: ["beat", "rhythm", "steady", "pattern", "percussion"],
        mission: "Clap, tap, and write rhythm ideas that stay connected to a steady beat.",
        reflection: "Did the steady beat or the rhythm pattern feel harder today?",
        materials: ["pencil", "tabletop or body percussion"],
        buildQuestions: musicQuestionsOne,
        extensionActivity: "Teach your best rhythm to a family member and see if they can echo it back.",
      },
      {
        title: "Pattern Builder",
        essentialQuestion: "How do repetition and contrast make music easier to follow?",
        learningObjective: "I can create an A-B pattern and explain how it changes.",
        hook: "Listeners love patterns because they provide both surprise and structure.",
        miniLesson: "Music uses repetition to create familiarity and contrast to keep attention alive.",
        vocabulary: ["repeat", "contrast", "phrase", "pattern", "rest"],
        mission: "Build a simple pattern with clear parts and perform it with confidence.",
        reflection: "What made your pattern feel complete?",
        materials: ["pencil", "body percussion"],
        buildQuestions: musicQuestionsTwo,
        extensionActivity: "Record or perform your pattern again with a new dynamic, speed, or rest.",
      },
    ],
  },
  {
    id: "health-wellness-rangers",
    subject: "Health",
    title: "Wellness Rangers",
    unitTitle: "Healthy Habits and Safety Choices",
    description: "Students connect daily habits, self-awareness, and safety planning.",
    funTheme: "Body signals and smart choices",
    skills: ["wellness", "safety", "self-awareness", "decision making"],
    lessons: [
      {
        title: "Healthy Day Moves",
        essentialQuestion: "Which daily habits help a body learn, grow, and recover well?",
        learningObjective: "I can identify healthy habits and make a realistic personal plan.",
        hook: "Wellness is built from small daily choices, not one giant perfect choice.",
        miniLesson: "Food, water, sleep, movement, and hygiene work together. When one is missing, the whole day can feel harder.",
        vocabulary: ["habit", "hydrate", "rest", "balance", "routine"],
        mission: "Build a healthy-day plan and explain why the choices matter.",
        reflection: "Which habit feels easiest to strengthen this week?",
        materials: ["pencil"],
        buildQuestions: healthQuestionsOne,
        extensionActivity: "Hang a small habit tracker where the student can see it tomorrow.",
      },
      {
        title: "Safety Signals",
        essentialQuestion: "How do body signals and trusted adults help us stay safe?",
        learningObjective: "I can notice warning signs and explain smart next steps.",
        hook: "Safety grows when we notice signals early and know who can help.",
        miniLesson: "Safe choices come from paying attention to the body, the place, and the people around you.",
        vocabulary: ["signal", "trusted adult", "emergency", "warning", "plan"],
        mission: "Practice what to notice, who to tell, and what to do in common safety situations.",
        reflection: "Which safety step is most important to remember under stress?",
        materials: ["pencil"],
        buildQuestions: healthQuestionsTwo,
        extensionActivity: "Review a real family meeting place or contact plan together.",
      },
    ],
  },
  {
    id: "physical-education-movement-quest",
    subject: "Physical Education",
    title: "Movement Quest",
    unitTitle: "Control, Endurance, and Reflection",
    description: "Students connect movement practice to body awareness and goal setting.",
    funTheme: "Balance tests and movement circuits",
    skills: ["balance", "coordination", "endurance", "goal setting"],
    lessons: [
      {
        title: "Balance and Control",
        essentialQuestion: "How do balance and control improve movement?",
        learningObjective: "I can describe and reflect on key movement skills during practice.",
        hook: "Athletes get better when they notice what their body is doing, not just whether they finished.",
        miniLesson: "Control comes from body awareness, balance, and repeated practice of small movement patterns.",
        vocabulary: ["balance", "coordination", "locomotor", "control", "warm-up"],
        mission: "Complete the balance and movement reflections after trying the physical tasks.",
        reflection: "What did your body do to help you stay steady?",
        materials: ["pencil", "safe open space"],
        buildQuestions: peQuestionsOne,
        extensionActivity: "Repeat the balance test later in the week and compare results.",
      },
      {
        title: "Keep It Going",
        essentialQuestion: "How does endurance help us move well over time?",
        learningObjective: "I can describe pacing, recovery, and a realistic personal movement goal.",
        hook: "Strong movers know when to push, when to pace, and when to recover.",
        miniLesson: "Endurance is built gradually. Recovery, hydration, and pacing are part of the skill, not signs of weakness.",
        vocabulary: ["endurance", "pace", "recover", "effort", "goal"],
        mission: "Think like a coach while you observe and plan your own movement practice.",
        reflection: "What kind of effort feels sustainable for you right now?",
        materials: ["pencil", "safe open space"],
        buildQuestions: peQuestionsTwo,
        extensionActivity: "Build a simple weekly movement calendar with one doable goal.",
      },
    ],
  },
];

const worksheetTrackMap = worksheetTracks.reduce<Record<MarylandSubject, CurriculumTrack>>((acc, track) => {
  acc[track.subject] = track;
  return acc;
}, {} as Record<MarylandSubject, CurriculumTrack>);

export function listWorksheetCurricula(): WorksheetCurriculumOverview[] {
  return worksheetTracks.map((track) => ({
    id: track.id,
    subject: track.subject,
    title: track.title,
    unitTitle: track.unitTitle,
    description: track.description,
    funTheme: track.funTheme,
    skills: track.skills,
    lessonCount: track.lessons.length,
  }));
}

export function getWorksheetCurriculumOverview(subject: string) {
  const normalizedSubject = normalizeSubjectName(subject) ?? "English";
  const track = worksheetTrackMap[normalizedSubject];

  return {
    id: track.id,
    subject: track.subject,
    title: track.title,
    unitTitle: track.unitTitle,
    description: track.description,
    funTheme: track.funTheme,
    skills: track.skills,
    lessonCount: track.lessons.length,
  } satisfies WorksheetCurriculumOverview;
}

export function buildCurriculumWorksheet(input: CurriculumWorksheetInput): WorksheetPayload {
  const subject = normalizeSubjectName(input.subject) ?? "English";
  const track = worksheetTrackMap[subject];
  const lessonIndex = input.existingWorksheetCount % track.lessons.length;
  const lesson = track.lessons[lessonIndex];
  const supportLevel = resolveSupportLevel(input.supportLevel);
  const gradeBand = getGradeBand(input.gradeLevel);
  const questions = lesson.buildQuestions({
    questionCount: input.questionCount,
    supportLevel,
    gradeBand,
    mathLevel: input.mathLevel,
  });

  return {
    title: `${track.title}: Lesson ${lessonIndex + 1} - ${lesson.title}`,
    student_name: input.studentName,
    subject,
    date: new Date().toISOString().slice(0, 10),
    track_id: track.id,
    track_title: track.title,
    unit_title: track.unitTitle,
    lesson_title: lesson.title,
    lesson_number: lessonIndex + 1,
    total_lessons: track.lessons.length,
    fun_theme: track.funTheme,
    essential_question: lesson.essentialQuestion,
    learning_objective: lesson.learningObjective,
    instructions:
      "Complete the launch, use the mini lesson to help you, and answer the mission questions with clear thinking. Save the page as evidence when you finish.",
    materials: lesson.materials,
    sections: buildSections({
      lesson,
      supportLevel,
      readingLevel: input.readingLevel,
    }),
    questions,
    extension_activity: lesson.extensionActivity,
    parent_notes: `Curriculum path: ${track.title}. Lesson ${lessonIndex + 1} of ${track.lessons.length}. Support level: ${supportLevel.replace("_", " ")}. Encourage complete answers, then save this sheet or a photo for the portfolio.`,
  };
}

import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIQuestionRequest {
  mode: string;
  region: string;
  difficulty: number;
  previousQuestions?: string[];
}

export interface AIQuestionResponse {
  question: string;
  hint: string;
  answer: string;
  alternativeAnswers: string[];
  funFact: string;
  difficulty: number;
}

export interface AICommentaryRequest {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionText: string;
  country: string;
  mode: string;
}

export interface AICommentaryResponse {
  commentary: string;
  encouragement: string;
  learningTip: string;
}

export async function generateQuestion(request: AIQuestionRequest): Promise<AIQuestionResponse> {
  const { mode, region, difficulty, previousQuestions = [] } = request;
  
  const modePrompts: Record<string, string> = {
    'capitals': 'Generate a straightforward capital city question',
    'mispronounced-capitals': 'Generate a question about a capital city that is commonly mispronounced, include pronunciation guidance',
    'multiple-capitals': 'Generate a question about a country with multiple capitals (administrative, legislative, judicial)',
    'hidden-outlines': 'Generate a question about identifying a country from its shape/outline',
    'flag-quirks': 'Generate a question about unique or interesting features of a country\'s flag',
    'mystery-mix': 'Generate a fascinating geography trivia question with surprising facts'
  };

  const regionContext = region === 'global' ? 'any country worldwide' : `countries in ${region}`;
  const difficultyContext = difficulty <= 2 ? 'easy and well-known' : difficulty <= 3 ? 'moderately challenging' : 'difficult and obscure';
  
  const previousQuestionsText = previousQuestions.length > 0 
    ? `\n\nAvoid repeating these previous questions: ${previousQuestions.join(', ')}`
    : '';

  const prompt = `You are creating geography quiz questions for an educational game called GeoWiz.

Mode: ${mode} - ${modePrompts[mode as keyof typeof modePrompts] || 'Generate a geography question'}
Region: ${regionContext}
Difficulty: ${difficultyContext} (level ${difficulty}/5)
${previousQuestionsText}

Create a question that is engaging, educational, and appropriate for the difficulty level. Return your response in this exact JSON format:
{
  "question": "The main question text",
  "hint": "A helpful hint without giving away the answer",
  "answer": "The correct answer in lowercase",
  "alternativeAnswers": ["alternative1", "alternative2"],
  "funFact": "An interesting fact related to the answer",
  "difficulty": ${difficulty}
}

Make sure the question is unique, factually accurate, and engaging for geography enthusiasts!`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert geography educator creating engaging quiz questions. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      question: result.question || "What is the capital city?",
      hint: result.hint || "Think about major world capitals",
      answer: result.answer?.toLowerCase() || "unknown",
      alternativeAnswers: result.alternativeAnswers || [],
      funFact: result.funFact || "This is an interesting place!",
      difficulty: difficulty
    };
  } catch (error) {
    console.error("Error generating AI question:", error);
    throw new Error("Failed to generate question with AI");
  }
}

export async function generateCommentary(request: AICommentaryRequest): Promise<AICommentaryResponse> {
  const { userAnswer, correctAnswer, isCorrect, questionText, country, mode } = request;
  
  const prompt = `You are providing feedback for a geography quiz game called GeoWiz.

Question: ${questionText}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
Country/Topic: ${country}
Game Mode: ${mode}

Provide encouraging, educational feedback that:
1. Acknowledges their answer (whether right or wrong)
2. Provides interesting context about the correct answer
3. Gives a learning tip for future questions

Return your response in this exact JSON format:
{
  "commentary": "Main feedback about their answer and the correct answer",
  "encouragement": "Positive, motivating message",
  "learningTip": "A helpful tip for similar questions"
}

Keep the tone friendly, educational, and encouraging!`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an encouraging geography tutor providing personalized feedback. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      commentary: result.commentary || "Thanks for your answer!",
      encouragement: result.encouragement || "Keep exploring the world!",
      learningTip: result.learningTip || "Practice makes perfect!"
    };
  } catch (error) {
    console.error("Error generating AI commentary:", error);
    throw new Error("Failed to generate commentary with AI");
  }
}
import { GoogleGenAI, Type } from "@google/genai";
import { DashboardData, Transaction, Account, Category } from '../types';

// This is a placeholder for the API key, which is expected to be
// in the environment variables.
const FAKE_API_KEY = "TODO";
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY ?? FAKE_API_KEY });

export interface FinancialAnalysis {
    overview: string;
    keyObservations: string[];
    actionableAdvice: string[];
    disclaimer: string;
}

export interface FinancialData {
    assets: number;
    liabilities: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyCashflow: number;
    expenseBreakdown: { category: string; amount: number }[];
}

const getSystemInstruction = () => `You are "Financify AI", a helpful and friendly financial assistant.
Your goal is to analyze the user's financial data and provide clear, concise, and actionable insights in a conversational tone.
The user will provide their financial data in JSON format along with a question.
Base your answers *only* on the data provided. Do not invent numbers or transactions.
Keep your answers brief and to the point.
If a question is vague, ask for clarification. If it's outside the scope of finance, politely decline to answer.
When providing amounts, use the currency symbol provided in the data.
`;

const formatDataForPrompt = (data: { personal: DashboardData, home: DashboardData }, currency: string) => {
    const relevantData = {
        currency,
        personal: {
            accounts: data.personal.accounts.map(({ id, name, type, isArchived, creditLimit }) => ({ id, name, type, isArchived, creditLimit })),
            transactions: data.personal.transactions.slice(-50).map(({ date, description, amount, categoryId, classification }) => ({ date, description, amount, categoryId, classification })),
            categories: data.personal.categories.map(({ id, name }) => ({ id, name })),
        },
        home: {
            accounts: data.home.accounts.map(({ id, name, type, isArchived, creditLimit }) => ({ id, name, type, isArchived, creditLimit })),
            transactions: data.home.transactions.slice(-50).map(({ date, description, amount, categoryId, classification }) => ({ date, description, amount, categoryId, classification })),
            categories: data.home.categories.map(({ id, name }) => ({ id, name })),
        }
    };
    return JSON.stringify(relevantData, null, 2);
}

export const getAiChatResponse = async (
    question: string,
    financialData: { personal: DashboardData, home: DashboardData },
    currency: string
): Promise<string> => {
    const dataString = formatDataForPrompt(financialData, currency);

    const prompt = `
Here is my financial data:
\`\`\`json
${dataString}
\`\`\`

My question is: "${question}"
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(),
            },
        });
        return response.text;
    } catch (e) {
        console.error("Gemini API Error:", e);
        return "Sorry, I encountered an error while processing your request. Please try again later.";
    }
};

export const getFinancialAnalysis = async (data: FinancialData): Promise<FinancialAnalysis> => {
    const prompt = `
        Analyze the following financial data and provide an overview, key observations, and actionable advice.
        The user wants a simple, clear analysis of their financial health.
        Data:
        ${JSON.stringify(data, null, 2)}
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            overview: { type: Type.STRING, description: 'A brief, one-sentence summary of the financial situation.' },
            keyObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'A list of 2-3 important observations from the data.'
            },
            actionableAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'A list of 2-3 practical, actionable suggestions for improvement.'
            },
            disclaimer: {
                type: Type.STRING,
                description: 'A standard disclaimer that this is not professional financial advice.'
            }
        },
        required: ['overview', 'keyObservations', 'actionableAdvice', 'disclaimer'],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful financial analyst. You provide insights in JSON format based on the provided schema.",
                responseMimeType: "application/json",
                responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Add a default disclaimer if the model forgets it
        if (!result.disclaimer) {
            result.disclaimer = "This is an AI-generated analysis and not professional financial advice. Please consult with a financial advisor for personalized guidance.";
        }
        return result as FinancialAnalysis;
    } catch (e) {
        console.error("Gemini API Error in getFinancialAnalysis:", e);
        throw new Error("Failed to get financial analysis from AI.");
    }
};

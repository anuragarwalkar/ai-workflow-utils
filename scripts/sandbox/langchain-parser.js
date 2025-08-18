// import { ChatOpenAI } from '@langchain/openai';
// import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import dotenv from 'dotenv';
// import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';


dotenv.config();

// const model = new ChatOpenAI({
//     apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
//     model: process.env.OPENAI_COMPATIBLE_MODEL,
//     temperature: 0,
//     configuration: {
//     baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
//     },
//     streaming: true,
// });

const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: process.env.GOOGLE_MODEL,
          temperature: 0,
          streaming: true,
})

// const tools = await client.getTools();


// const agent = createReactAgent({
//   llm: model,
//   tools
// });

const jiraBugSchema = z.object({
  fields: z.object({
    project: z.object({
      key: z.string().min(1, "Project key is required")
    }),
    summary: z.string().min(5, "Summary should be at least 5 characters"),
    description: z.string().min(20, "Description should include steps, actual, and expected results"),
    issuetype: z.object({
      name: z.literal("Bug")
    }),
    priority: z.object({
      name: z.enum(["Highest", "High", "Medium", "Low", "Lowest"])
    })
  })
});

// Create parser from schema
const parser = StructuredOutputParser.fromZodSchema(jiraBugSchema);

// Get format instructions for LLM
const formatInstructions = parser.getFormatInstructions();

// Create prompt
const prompt = new PromptTemplate({
  template: `Generate a Jira bug JSON.
The "description" field must be in Jira wiki markup format like:
h2. Steps to Reproduce
# Step 1
# Step 2

h2. Actual Result
- actual text

h2. Expected Result
- expected text

{format_instructions}

Bug details:
- App crashes when logging in`,
  inputVariables: [],
  partialVariables: { format_instructions: formatInstructions }
});

(async () => {
  const input = await prompt.format({});
  // const response = await model.invoke(input);
  // prints as it streams
  for await (const chunk of await model.stream(input)) {
  process.stdout.write(chunk.content || "");
}
  // const parsed = await parser.parse(response.content);
  // console.log(JSON.stringify(parsed, null, 2));
})();
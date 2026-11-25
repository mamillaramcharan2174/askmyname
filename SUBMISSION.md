# AskMyData — Hackathon Submission Materials

**Theme:** Theme 9 — Data & Analytics Agents  
**Project Title:** AskMyData  
**Target Users:** Non-technical operators, business analysts, and managers who need insights from CSV data without knowing SQL.  
**Live Application URL:** https://askmydata-ai.vercel.app/  
**GitHub Repository:** https://github.com/mamillaramcharan2174/askmyname

---

## 1. Problem Statement (Paste into Submission Form)

Non-technical teams depend on data analyst queues to answer routine questions about business datasets (e.g., Salesforce exports, financial transactions, or user metrics), creating painful delays for decision-makers and repetitive interruptions for analysts. When users try generic chatbot tools, models regularly hallucinate schemas, generate syntax errors, silently guess ambiguous metrics, or fail to provide safe, verifiable calculation proofs.

---

## 2. Solution Description (Paste into Submission Form)

AskMyData is an intelligent, specialized analytics agent that turns natural language questions into safe, verifiable, read-only data insights on CSV datasets. 

Instead of generating unverified raw code or executing arbitrary SQL, AskMyData:
1. Profiles CSV datasets in-memory to infer strict column types and detect quality issues (`schema_profiler` tool).
2. Translates user inquiries into an allowlisted, safe Abstract Syntax Tree (AST) validated by Zod schemas (`safe_data_engine` tool).
3. Strictly refuses to guess when faced with ambiguous requests (e.g., *"Show performance"*), prompting the user with clear, clickable clarification options.
4. Renders responsive visual charts (Bar, Line, Area, Pie) and tables alongside readable pseudo-SQL and transparent execution traces (`chart_result_formatter` tool).
5. Preserves conversational context across multi-turn follow-up inquiries.
6. Seamlessly runs in zero-setup offline Demo Mode without requiring an external AI API key, while supporting Google Gemini Flash for full LLM reasoning.

---

## 3. Demo Video / Walkthrough Script (3–5 Minutes)

* **[0:00 - 0:45] Introduction & Ingestion:**
  * *"Welcome to AskMyData. Non-technical users need answers from CSV data without knowing SQL. Here, the user can upload any CSV or click our bundled Global B2B Tech Sales dataset. The schema profiler immediately detects 140 rows, 12 columns, data types (numeric, dates, strings), and zero null errors."*
* **[0:45 - 1:45] Primary Question & Trace Transparency:**
  * *"Let's ask: 'Which product had the highest sales last quarter?'"*
  * *"The agent generates a 5-step execution plan and a transparent multi-tool trace showing schema verification, query planning, safe engine calculation, and chart formatting with millisecond timings."*
  * *"The result is immediately visualized: a responsive Bar Chart showing AI Platform leading Q4 with $620,000, accompanied by an executive summary, plain-language caveats, and a validated Pseudo-SQL query."*
* **[1:45 - 2:30] Conversational Follow-Up Query:**
  * *"The user asks: 'Now break that down by region'."*
  * *"Notice context preservation: the agent retains the Q4 filter and revenue aggregation, automatically pivoting the grouping dimension to Region."*
* **[2:30 - 3:30] Ambiguity Guardrail (No Guessing):**
  * *"What happens with an ambiguous question? If a user enters 'Show performance', generic chatbots guess and hallucinate. AskMyData enforces a strict No-Guessing policy: it pauses, explains why the question is underspecified, and provides clickable clarification cards."*
* **[3:30 - 4:15] Safety & Malicious Injection Rejection:**
  * *"If someone tries 'Drop table users;' or asks for columns not in the dataset like 'employee salary', AskMyData safely intercepts the request, explains the schema limitation, and suggests valid metrics."*
* **[4:15 - 5:00] Wrap-up & History:**
  * *"The session history drawer lets users review or restore any previous calculation, and result tables can be exported as clean CSVs with one click. AskMyData makes data exploration fast, intuitive, and 100% safe."*

---

## 4. Key Differentiators & Highlights

* **100% Safe Execution:** Zero raw SQL generation, zero `eval()`, zero shell commands. All operations run via a strongly-typed in-memory AST engine.
* **Autonomous Fallback:** Fully functional out-of-the-box with built-in heuristic reasoning even when no external API key is provided.
* **Strict Clarification Guardrails:** Protects decision-makers by asking for clarification rather than hallucinating when parameters are missing.
* **Multi-Tool Architecture:** 3 dedicated tools (`schema_profiler`, `safe_data_engine`, `chart_result_formatter`) with Zod contract validation.
* **Transparent Execution Trace:** Full visibility into step statuses, tool inputs/outputs, and execution timing.

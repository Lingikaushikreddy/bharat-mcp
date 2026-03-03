# Product Requirements Document (PRD): Bharat-MCP
**Version**: 1.0  
**Status**: Draft / Technical Discovery  
**Owner**: Senior Full-Stack Lead / Product Owner  
**Last Updated**: March 2026

---

## 1. Executive Summary & Vision
By building **Bharat-MCP**, you aren't just building a tool; you are forging the robust "adapter" for the next generation of Indian AI startups. Bharat-MCP is a production-grade collection of Model Context Protocol (MCP) servers designed to seamlessly bridge the gap between Large Language Models (LLMs)—like Claude, ChatGPT, and custom LangChain agents—and the vast Indian Fintech and GovTech ecosystem. It empowers AI agents to securely interact directly with IndiaStack and major private payment gateways through a standardized, zero-trust interface.

Our vision is to make India's world-class digital payment and identity infrastructure "agent-ready" from day one, drastically cutting down developer overhead and unlocking automated, contextual, and secure AI-driven workflows.

---

## 2. The Problem Space
Despite India possessing the world's most advanced digital public infrastructure (DPI), modern AI agents remain frustratingly "blind" to it. This gap surfaces several critical issues:

*   **The DIY "Tax" on Innovation**: Every Indian AI startup is currently spending ~20% of their core development cycles rewriting boilerplate code for basic tasks like parsing Razorpay webhooks or checking UPI status.
*   **Context Fragmentation**: LLMs lack a standardized, native way to "understand" and process the intricate response schemas of Indian government APIs (e.g., GSTN, DigiLocker, Aadhaar).
*   **Security & Compliance Risks**: DIY integration attempts often fall short of the rigorous security and compliance standards mandated by the RBI for handling Personally Identifiable Information (PII) and financial tokens, exposing startups to liability.

---

## 3. Target User Personas
| Persona | Key Pain Point | Core Use Case |
| :--- | :--- | :--- |
| **AI Startup Founder** | Needs to ship product fast without worrying about underlying integration compliance. | Wants to seamlessly enable their "AI Accountant" product to fetch GST data automatically. |
| **Fintech Developer** | Bogged down by creating custom wrappers around legacy systems. | Wants to inject a natural language interface into a complex, legacy payment operations dashboard. |
| **Enterprise Architect** | Security and scale concerns surrounding autonomous agents executing financial tasks. | Integrating LLM agents into customer support workflows for safe, automated refund processing. |

---

## 4. Core Feature Set (The "Pack")
The solution will be delivered as an easily consumable Monorepo (TypeScript/Node.js) containing independent, containerized (Dockerized) MCP servers.

### 4.1. `mcp-server-razorpay`
*   **Objective**: Enable agents to read payment states and execute safe transactions.
*   **Core Tools**: `create_order`, `fetch_payment_status`, `trigger_refund`, `list_subscriptions`.
*   **Contextual Value**: Feeds rich order history, settlement logs, and dispute states directly into the LLM's working context window.

### 4.2. `mcp-server-upi`
*   **Objective**: Provide a native agentic interface to the UPI network (via aggregators like Setu/Razorpay).
*   **Core Tools**: `generate_dynamic_qr`, `verify_vpa` (Virtual Payment Address), `check_transaction_status`.

### 4.3. `mcp-server-indiastack`
*   **Objective**: Identity and Document retrieval natively within the agent loop.
*   **Aadhaar eKYC**: Tools to securely initiate and verify OTP-based workflows based on consent.
*   **DigiLocker**: Tools to pull specifically issued documents (e.g., PAN, DL, vehicle RC) directly into the agent’s context for autonomous verification tasks.

### 4.4. `mcp-server-gstn`
*   **Objective**: Automate tax compliance and vendor verification.
*   **Core Tools**: `search_taxpayer_by_gstin`, `verify_filing_status`.

---

## 5. Technical Architecture & Design Principles

### 5.1. Tech Stack
*   **Language**: TypeScript (industry standard for the MCP SDK).
*   **Core Framework**: FastMCP or the official `@modelcontextprotocol/sdk`.
*   **Transport Layer**: Support for both `stdio` (for local IDE/desktop agent use) and `SSE` (Server-Sent Events for remote/cloud-based production use).
*   **Deployment**: Distributed as Docker images and orchestrated via Kubernetes Helm charts for enterprise adoption.

### 5.2. Agent-Centric Design Principles
*   **LLM-Native Schemas**: Tool names and parameter descriptions must be semantically engineered for LLM "reasoning." 
    * *Example*: Instead of the generic `get_status()`, use `check_if_user_paid_via_upi()`.
*   **Idempotency by Default**: All financial, mutation-based tools (e.g., triggering refunds, creating orders) MUST require an `idempotency_key` to prevent accidental double-spending by looping agents.
*   **Zero-Trust Security**: The MCP server operates strictly as a pass-through layer. Absolutely **no PII** should be cached or stored locally; data should only exist transiently in the LLM's context or the upstream API provider.

---

## 6. Security, Trust & RBI Compliance
Operating within the Indian Fintech ecosystem necessitates strict adherence to RBI guidelines. Bharat-MCP must be secure by design:

*   **Environment Variable Masking**: Implement strict scrubbing to ensure sensitive API keys (e.g., Razorpay Secret) are never leaked into execution logs or returned in LLM context windows.
*   **Token-Bucket Rate Limiting**: Implement strict rate limits at the MCP server level. This acts as a circuit breaker to prevent rogue "Agent Loops" from unintentionally draining bank accounts or hitting hard API rate limits upstream.
*   **Immutable Audit Logging**: Every tool execution must generate a cryptographic trace ID, immutably linking the originating LLM prompt (or execution trace) to the exact downstream API call.

---

## 7. Go-to-Market & Product Roadmap

### **Phase 1: Minimum Viable Product (MVP) [Weeks 1-4]**
*   **Milestones**: Establish the core architecture and basic utility.
*   **Deliverables**: 
    * Setup Monorepo (using Turborepo).
    * Release `mcp-server-razorpay` and `mcp-server-gstn`.
    * Provide a friction-free "One-Click Deploy" `docker-compose.yml` for local evaluation.

### **Phase 2: IndiaStack & Cloud Readiness [Weeks 5-8]**
*   **Milestones**: Integrate identity and support cloud transport.
*   **Deliverables**:
    * Add DigiLocker and Aadhaar eKYC via Sandbox providers (Setu, Cashfree, etc.).
    * Implement and document SSE transport for secure integration with cloud-based AI agents.

### **Phase 3: Ecosystem Growth & Community [Weeks 9+]**
*   **Milestones**: Expand beyond core fintech into the broader Indian B2B/B2C ecosystem.
*   **Deliverables**:
    * Foster community-contributed servers for massive partner APIs (e.g., Zomato, Swiggy, Tally Integration).
    * Build an official configuration generator for Claude Desktop to onboard non-technical users instantly.

---

## 8. Success Metrics & KPIs
To measure the true impact of Bharat-MCP, we will track the following KPIs:

1.  **Developer Adoption / Vitality**: 
    * Number of GitHub Stars, forks, and unique Docker image pulls.
    * Active contributors to the monorepo outside the core team.
2.  **Implementation Efficiency**: 
    * Drastic reduction in lines of code (LOC) required for an AI agent to execute a bespoke payment check.
    * *Target*: **> 70% reduction** in boilerplate LOC per startup.
3.  **Operational Reliability**: 
    * System stability across tools.
    * *Target*: **99.9% success rate** on MCP tool execution calls during simulated agent load testing.
    * Zero security incidents involving leaked credentials in logs.

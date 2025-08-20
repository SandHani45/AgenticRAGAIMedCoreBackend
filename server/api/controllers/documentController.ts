// Document API Controller
// Handles document CRUD and AI extraction for MediConnect
import {
  ADMIN_DOCUMENT_STORE_PATH,
  DOCUMENT_STORE_PATH,
} from "server/constant/config";
import { DocumentModel } from "../models/document";
import { Response, Request } from "express";
import { setupRagPipeline } from "./agentController";
import { pdfToText } from "../util/pdfToText";
import { AdminDocumentModel } from "../models/adminDocument";
import dotenv from "dotenv";
dotenv.config();

/**
 * GET /documents/:type
 * Fetch all documents of a given type ("reference" or "patient").
 * Used for listing documents by category.
 */
export async function getDocumentsByType(req: Request, res: Response) {
  const { type } = req.params;
  try {
    if (type !== "reference" && type !== "patient") {
      return res.status(400).json({ message: "Invalid document type" });
    }
    const documents = await DocumentModel.find({ type });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents by type:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
}

/**
 * POST /documents/upload
 * Upload a document for the authenticated user.
 * Saves metadata and triggers AI extraction on the uploaded file.
 * Returns extracted data and upload status.
 */
export async function uploadDocument(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Missing file" });
  }

  // Set name and type based on file
  let name = file.originalname;
  let type: "reference" | "patient" = "reference";
  if (file.mimetype.startsWith("application/pdf")) {
    type = "reference";
  } else if (file.mimetype.startsWith("image/")) {
    type = "patient";
  }
  let uploadType = req.body?.uploadType || "doctor"; // default to 'doctor' if not specified
  try {
    const publicPath = `${DOCUMENT_STORE_PATH}`;
    // convert PDF to text
    const pdfText = await pdfToText(`${publicPath}/${file.filename}`);
    console.log("Extracted PDF text:", pdfText);
    // Get userId from token (req.user)
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user found in token" });
    }

    const newDocument = new DocumentModel({
      name,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      type,
      userId,
      patientId: req.body.patientId,
      status: "uploaded",
      metadata: req.body.metadata,
      fileUrl: publicPath,
      uploadType, // default to 'doctor' if not specified
    });

    await newDocument.save();
    const appAPI = await setupRagPipeline();
    const patient_data = pdfText;

    const ragPrompt = `
You are a clinical AI assistant.  
Your task is to analyze the provided patient data and the retrieved medical documents, then extract relevant structured information.  

Rules:
- Always return the output strictly in JSON format (no explanations, no text outside JSON).  
- Use the document context to match ICD-10 codes or terminology.  
- If a field is not available, return it as an empty object '''{}'''.  
- Do not hallucinate. Only use information present in the documents.  
- Keys must follow the schema exactly: 
  "Past medical history", "Social history", "Impression", "Diagnosis".  

Context (retrieved from documents):
{retrieved_documents}

Patient Data:
${patient_data}

Output JSON:
{
  "Past medical history": {
    "Hypertension": "I10",
    "Type 2 Diabetes Mellitus": "E11.9"
  },
  "Social history": {
    "Long term (current) use of anticoagulants": "Z79.01"
  },
  "Impression": {
    "Unspecified atrial fibrillation": "I48.91"
  },
  "Diagnosis": {
    "Chest pain, unspecified": "R07.9"
  }
}
`;
    console.log("LLM Base URL:", process.env.LLM_API_BASE_URL);
    // Call LLM API
    const llmResponse = await fetch(`${process.env.LLM_API_BASE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: ragPrompt }),
    });
    console.log("LLM API response:", llmResponse);
    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.statusText}`);
    }

    let data = await llmResponse.json();
    // If data.answer is a string, try to parse as JSON (handle code fences)
    let parsedAnswer = data.answer;
    if (typeof parsedAnswer === "string") {
      try {
        // Remove leading/trailing whitespace and code fences
        const cleaned = parsedAnswer.trim().replace(/^```json\n?|```$/g, "");
        parsedAnswer = JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse LLM response as JSON", parsedAnswer);
      }
    }
    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        "documentData": parsedAnswer
      },
      sources: data.sources || [],
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Failed to upload document" });
  }
}

/**
 * POST /documents/admin-upload
 * Admin-only document upload endpoint.
 * Similar to uploadDocument, but for admin users and may include extra metadata.
 */
export async function adminUploadDocument(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Missing file" });
  }

  // Set name and type based on file
  let name = file.originalname;
  let type: "reference" | "patient" = "reference";
  if (file.mimetype.startsWith("application/pdf")) {
    type = "reference";
  } else if (file.mimetype.startsWith("image/")) {
    type = "patient";
  }
  let uploadType = req.body?.uploadType || "doctor"; // default to 'doctor' if not specified
  try {
    const publicPath = `${ADMIN_DOCUMENT_STORE_PATH}`;

    // Get userId from token (req.user)
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user found in token" });
    }

    const newDocument = new AdminDocumentModel({
      name,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      type,
      userId,
      patientId: req.body.patientId,
      status: "uploaded",
      metadata: req.body.metadata,
      fileUrl: publicPath,
      uploadType, // default to 'doctor' if not specified
    });

    await newDocument.save();
    const appAPI = await setupRagPipeline();
    const queryText = "What is the document about?";
    const customPrompt = `You are a precise data extractor. From the uploaded document, read the content carefully and return only the requested information in a structured JSON format. Ignore unrelated text. If any field is missing, return it as null.
Document: [UPLOAD]
Required fields: [list your required fields here, e.g., Name, Date, Amount, Invoice Number, etc.] ${queryText}`;
    let data = await appAPI.query(customPrompt);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Failed to upload document" });
  }
}

/**
 * GET /documents/detail/:id
 * Fetch details of a single document by its ID.
 * Used for viewing document metadata and status.
 */
export async function getDocumentDetail(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    console.error("Error fetching document detail:", error);
    res.status(500).json({ message: "Failed to fetch document detail" });
  }
}

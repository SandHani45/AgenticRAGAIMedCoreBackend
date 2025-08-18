import { Response, Request } from "express";
import path from "path";
import { RAGApplicationBuilder, SIMPLE_MODELS } from "@llm-tools/embedjs";
import { OpenAiEmbeddings } from "@llm-tools/embedjs-openai";
import { MongoDb } from "@llm-tools/embedjs-mongodb";
// import { WebLoader } from '@llm-tools/embedjs-loader-web';
import { PdfLoader } from "@llm-tools/embedjs-loader-pdf";
import dotenv from "dotenv";
import { ADMIN_DOCUMENT_STORE_PATH } from "server/constant/config";
import { AdminDocumentModel } from "../models/adminDocument";
import { calculatePoints } from "../util/fuse";
dotenv.config();

export async function setupRagPipeline() {
  // Get latest uploaded PDF document
  const latestDoc = await AdminDocumentModel.findOne({
    mimeType: "application/pdf",
  }).sort({ createdAt: -1 });
  let pdfPath;
  if (latestDoc && latestDoc?.fileUrl) {
    pdfPath = path.join(
      process.cwd(),
      `${ADMIN_DOCUMENT_STORE_PATH}`,
      latestDoc.filename
    );
  } else {
    pdfPath = path.join(
      `${process.cwd()}`,
      `${ADMIN_DOCUMENT_STORE_PATH}`,
      "ICD 10.pdf"
    );
  }
  console.log("Setting up RAG pipeline with PDF:", pdfPath);
  const vectorDb = new MongoDb({
    connectionString:
      process.env.MONGODB_URI ??
      (() => {
        throw new Error("MONGODB_URI environment variable is not set");
      })(),
  });

  let appAPI;
  if (true) {
    // If data exists, reuse the existing vector database
    appAPI = await new RAGApplicationBuilder()
      .setEmbeddingModel(new OpenAiEmbeddings())
      .setModel(SIMPLE_MODELS["OPENAI_GPT3.5_TURBO"])
      .setVectorDatabase(vectorDb)
      .build();
  } else {
    // If not, build and add loader
    appAPI = await new RAGApplicationBuilder()
      .setEmbeddingModel(new OpenAiEmbeddings())
      .setModel(SIMPLE_MODELS["OPENAI_GPT3.5_TURBO"])
      .setVectorDatabase(vectorDb)
      .build();
    await appAPI.addLoader(new PdfLoader({ filePathOrUrl: pdfPath }));
  }
  return appAPI;
}

export async function askMe(req: Request, res: Response) {
  try {
    console.log("Received query:", req.body.query);
    const { query } = req.body;
    let queryText = query ? query : "No patient note provided";

    const appAPI = await setupRagPipeline();
    console.log("Scoring prompt:", queryText);

    const data = await appAPI.query(queryText);
    res.json({ answer: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function getEDPoints(req: Request, res: Response) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    const { result } = await calculatePoints(query);
    res.json({ result: result });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

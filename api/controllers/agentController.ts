import { Response, Request } from "express";
import path from "path";
import { RAGApplicationBuilder, SIMPLE_MODELS } from "@llm-tools/embedjs";
import { OpenAiEmbeddings } from "@llm-tools/embedjs-openai";
import { MongoDb } from "@llm-tools/embedjs-mongodb";
// import { WebLoader } from '@llm-tools/embedjs-loader-web';
import { PdfLoader } from "@llm-tools/embedjs-loader-pdf";
import dotenv from "dotenv";
import {
  ADMIN_DOCUMENT_STORE_PATH,
} from "server/constant/config";
import { AdminDocumentModel } from "../models/adminDocument";
import { IntialTriage } from "server/prompt/intialTrage";
dotenv.config();

let cachedAppAPI: any | null = null;
let ragReady = false;

export async function setupRagPipeline() {
  if (ragReady && cachedAppAPI) return cachedAppAPI;
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
    pdfPath = path.join(`${process.cwd()}/server/data`, "ICD10.pdf");
  }
  console.log("Setting up RAG pipeline with PDF:", pdfPath);
  const appAPI = await new RAGApplicationBuilder()
    .setEmbeddingModel(new OpenAiEmbeddings())
    .setModel(SIMPLE_MODELS["OPENAI_GPT3.5_TURBO"])
    .setVectorDatabase(
      new MongoDb({
        connectionString:
          process.env.MONGODB_URI ??
          (() => {
            throw new Error("MONGODB_URI environment variable is not set");
          })(),
      })
    )
    .build();
  await appAPI.addLoader(new PdfLoader({ filePathOrUrl: pdfPath }));
  cachedAppAPI = appAPI;
  ragReady = true;
  return appAPI;
}

export async function askMe(req: Request, res: Response) {
  try {
    console.log("Received query:", req.body.query);
    const { query } = req.body;
    let queryText = query ? query : "No patient note provided";

    const appAPI = await setupRagPipeline();

    const scoringPrompt = `
You are a medical triage point calculator.

Rules:
1. Start with a base point value of 35.
2. Look for matches in the patient's note against the POINT TABLE below.
3. Each match adds the corresponding points only once (no duplicates).
4. Output ONLY valid JSON in the format:
{
  "EDPoint": {
    "point": <total points>,
    "source": {
      "<intervention name>": <points>,
      ...
    }
  }
}

POINT TABLE:
Five (5) Point assessments:
O2 cannula: 5
Ice bag application: 5
Note for work/school: 5
RX Refill only- asymptomatic: 5
Dressing change simple, wound recheck, suture removal: 5
Discharge discussion- straightforward: 5

Ten (10) Point assessments:
Beside Ultrasound/Bladder scan: 10
Photography: 10
Apply Ace wrap/sling/splint/shoulder immobilizer/crutches: 10
Discharge/AMA discussion- moderate: 10
Ear irrigation: 10
Fetal Heart Measurement: 10
Obtain clean catch urine: 10
Pacer interrogation: 10
Procedures (Prep/Assist) for lac repair, I&D, FB Removal, Dental/Nerve block: 10
"Road Test" Nurse walks with patient to evaluate O2 saturation and gait: 10
Toileting assistance: 10
Visual acuity alone (Snellen): 10
Wound Care: 10

Fifteen (15) Point assessments:
Administration of meds- PO/nasal/eye/transdermal/Suppository/Vaccine or IM/SC: 15
Ambulance/EMS patient receipt: 15
Cardiac monitoring (continuous) >1 hour OR Cardioversion, CPR: 15
Chaperoned exam- rectal/pelvic/breast/genital: 15
Code grey/Code stroke/Code STEMI/Rapid Response: 15
Diagnostic test Prep for 1 diagnostic test (lab, EKG, x-ray): 15
Emesis/incontinence care: 15
Enema: 15
Fluorescein stain/Eye irrigation: 15
Foley catheter; in & out catheters: 15
Heparin/saline lock placement: 15
Interpreter: 15
Nebulizer treatment: 15
Procedures (prep/assist) such as joint asp/inj., simple fracture care: 15
Social worker simple intervention/Mental health Routine Psych assessment: 15

Twenty (20) Point assessments:
Admin & monitoring of infusions or parental meds (IV, IO): 20
C-Spine precautions: 20
Diagnostic test Prep (labs, EKG, x-ray) Any two: 20
Diagnostic test Prep for Special Imaging (CT, MRI, US, VQ scan) Any one: 20
Discharge discussion-complex: 20
Epistaxis: 20
Full bed bath: 20
Irrigation w/3-way Foley: 20
Port-a-cath/venous access (existing): 20
Procedure, Complex (Prep/Assist): 20
NG/PEG Tube placement/replacement/care: 20
Seizure precautions: 20

Thirty (30) Point assessments:
Blood Transfusion: 30
Diagnostic test Prep for >= 3 tests: 30
Diagnostic test, prep for Special Imaging 2 or more: 30
Moderate sedation: 30
Physical or chemical restraints/Sitter/Isolation/Suicidal/Psychotic: 30
Procedures (Prep/Assist) such as central line insertion, gastric lavage, LP, paracentesis: 30
Sexual assault exam: 30
Social Worker, Extended: 30
Titrating IV drips: 30
Trauma activation w/o critical care: 30


Only consider exact or close wording matches. Ignore irrelevant text.  
Always sum base 35 + unique matches.

Example Input:
"Patient received O2 cannula, had beside ultrasound and photography."

Example Output:
{
  "EDPoint": {
    "point": 60,
    "source": {
      "O2 cannula": 5,
      "Beside Ultrasound/Bladder scan": 10,
      "Photography": 10
    }
  }
}
  
Patient note:
${queryText}
`;

    console.log("Scoring prompt:", scoringPrompt);

    const data = await appAPI.query(scoringPrompt);
    res.json({ answer: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}


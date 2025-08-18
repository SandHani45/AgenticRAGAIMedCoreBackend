import Fuse from "fuse.js"; // npm install fuse.js

// ---------------- POINT TABLE ----------------
const pointTable = [
  { text: "Discharge discussion- straightforward", point: 5 },
  { text: "Dressing change simple, wound recheck, suture removal", point: 5 },
  { text: "Ice bag application", point: 5 },
  { text: "Note for work/school", point: 5 },
  { text: "O2 cannula", point: 5 },
  { text: "RX Refill only- asymptomatic", point: 5 },

  { text: "Apply Ace wrap/sling/splint/shoulder immobilizer/crutches", point: 10 },
  { text: "Beside Ultrasound/Bladder scan", point: 10 },
  { text: "Discharge/AMA (Against Medical Advice) discussion- moderate", point: 10 },
  { text: "Ear irrigation", point: 10 },
  { text: "Fetal Heart Measurement", point: 10 },
  { text: "Obtain clean catch urine", point: 10 },
  { text: "Pacer interrogation", point: 10 },
  { text: "Photography", point: 10 },
  { text: "Procedures (Prep/Assist) for lac repair, I&D, FB Removal, Dental/Nerve block", point: 10 },
  { text: "“Road Test” Nurse walks with patient to evaluate O2 saturation and gait", point: 10 },
  { text: "Toileting assistance", point: 10 },
  { text: "Visual acuity alone- (Snellen)", point: 10 },
  { text: "Wound Care", point: 10 },

  { text: "Administration of meds- PO/nasal/eye/transdermal/Suppository/Vaccine or IM/SC (any one)", point: 15 },
  { text: "Chaperoned exam- rectal/pelvic/breast/genital", point: 15 },
  { text: "Diagnostic test Prep for 1 diagnostic test (lab, EKG, x-ray)", point: 15 },
  { text: "Emesis/incontinence care", point: 15 },
  { text: "Enema", point: 15 },
  { text: "Fluorescein stain/Eye irrigation", point: 15 },
  { text: "Foley catheter; in & out catheters", point: 15 },
  { text: "Interpreter", point: 15 },
  { text: "Nebulizer treatment", point: 15 },
  { text: "Procedures (prep/assist) such as joint asp/inj., simple fracture care", point: 15 },
  { text: "Social worker simple intervention/Mental health Routine Psych assessment", point: 15 },

  { text: "Admin & monitoring of infusions or parental meds (IV, IO)", point: 20 },
  { text: "C-Spine precautions- Backboard/C-Collar placement or removal", point: 20 },
  { text: "Diagnostic test Prep (labs, EKG, x-ray) Any two", point: 20 },
  { text: "Diagnostic test Prep for Special Imaging (CT, MRI, US, VQ scan) Any one", point: 20 },
  { text: "Discharge discussion-complex (multiple notes, extensive time spent)", point: 20 },
  { text: "Epistaxis", point: 20 },
  { text: "Full bed bath", point: 20 },
  { text: "Irrigation w/3-way Foley", point: 20 },
  { text: "Port-a-cath/venous access (existing)", point: 20 },
  { text: "Procedure, Complex (Prep/Assist), such as laceration repair, multiple fracture reduction", point: 20 },
  { text: "NG/PEG Tube placement/replacement/care Administration of charcoal", point: 20 },
  { text: "Seizure precautions", point: 20 },

  { text: "Blood Transfusion", point: 30 },
  { text: "Diagnostic test Prep for greater than or equal to 3 tests (labs, EKG, x-ray)", point: 30 },
  { text: "Diagnostic test, prep for Special Imaging 2 or more (CT, MRI, US, VQ scan) or any one combined with Lab, X-ray, EKG", point: 30 },
  { text: "Moderate sedation", point: 30 },
  { text: "Physical or chemical restraints/Sitter/Isolation/Suicidal/Psychotic", point: 30 },
  { text: "Procedures (Prep/Assist) such as central line insertion, gastric lavage, LP, paracentesis etc.", point: 30 },
  { text: "Sexual assault exam", point: 30 },
  { text: "Social Worker, Extended (multiple notes), change in living situation", point: 30 },
  { text: "Titrating IV drips", point: 30 },
  { text: "Trauma activation w/o critical care", point: 30 }
];

// ---------------- LEVEL RULES ----------------
const levelRules = [
  { min: 0, max: 29, level: 1, code: 99281, criteria: 45099281 },
  { min: 30, max: 59, level: 2, code: 99282, criteria: 45099282 },
  { min: 60, max: 89, level: 3, code: 99283, criteria: 45099283 },
  { min: 90, max: 109, level: 4, code: 99284, criteria: 45099284 },
  { min: 110, max: Infinity, level: 5, code: 99285, criteria: 45099285 }
];

// ---------------- FUSE SETUP ----------------
const fuse = new Fuse(pointTable, {
  keys: ["text"],
  threshold: 0.4, // 0.0 = exact match, 1.0 = loose match
});

// ---------------- MAIN FUNCTION ----------------
interface PointTableItem {
    text: string;
    point: number;
}

interface LevelRule {
    min: number;
    max: number;
    level: number;
    code: number;
    criteria: number;
}

interface EDPointSource {
    [key: string]: number;
}

interface EDPointResult {
    point: number;
    Level: number;
    criteria: number;
    source: EDPointSource;
}

interface Diagnosis {
    content: string;
}

interface CalculatePointsResult {
    result: {
        EDPoint: EDPointResult;
        diagnosis: Diagnosis;
    };
}

export async function calculatePoints(noteInput: string): Promise<CalculatePointsResult> {

    const notes: string[] = noteInput.split("\n").map(n => n.trim()).filter(Boolean);

    let totalPoints: number = 35; // base
    let source: EDPointSource = {};
    const matchedTexts = new Set<string>();

    notes.forEach(line => {
        const result = fuse.search(line);
        if (result.length > 0) {
            const best: PointTableItem = result[0].item;
            if (!matchedTexts.has(best.text)) {
                totalPoints += best.point;
                source[best.text] = best.point;
                matchedTexts.add(best.text);
            }
        }
    });

    // determine level
    const rule: LevelRule | undefined = levelRules.find(r => totalPoints >= r.min && totalPoints <= r.max);

    return {
        result: {
            EDPoint: {
                point: totalPoints,
                Level: rule ? rule.level : 0,
                criteria: rule ? rule.criteria : 0,
                source
            },
            diagnosis: {
                content: noteInput
            }
        }
    };
}

// ---------------- TEST ----------------
const noteInput = `Chaperoned exam- rectal/pelvic/breast/genital
Fluorescein stain/Eye irrigation
Procedures (prep/assist) w/ such as joint asp/inj
Diagnostic test, prep for Special Imaging 2 or more (CT, MRI, US, VQ scan) or any one combined with Lab, 
Sexual assault exam
O2 cannula
Procedures (Prep/Assist) for lac repair, I&D, FB Removal, Dental/Nerve bloc`;

console.log(JSON.stringify(calculatePoints(noteInput), null, 2));

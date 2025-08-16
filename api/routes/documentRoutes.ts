import { Router } from "express";
import { getDocumentsByType, uploadDocument, getDocumentDetail, adminUploadDocument } from "../controllers/documentController";
import multer from "multer";
import passport from "passport";
import { ADMIN_DOCUMENT_STORE_PATH, DOCUMENT_STORE_PATH } from "server/constant/config";

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, DOCUMENT_STORE_PATH);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});
const adminStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, ADMIN_DOCUMENT_STORE_PATH);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
const adminUpload = multer({ storage: adminStorage, limits: { fileSize: 200 * 1024 * 1024 } });
const router = Router();

router.get("/documents/:type", passport.authenticate("jwt", { session: false }), getDocumentsByType);
router.post("/documents/upload", passport.authenticate("jwt", { session: false }), upload.single("file"), uploadDocument);
router.post("/documents/admin/upload", passport.authenticate("jwt", { session: false }), adminUpload.single("file"), adminUploadDocument);
router.get("/documents/detail/:id", passport.authenticate("jwt", { session: false }), getDocumentDetail);

export default router;

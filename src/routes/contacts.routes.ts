import { Router } from "express";
import {
    createContact,
    deleteContact,
    getContactById,
    getContacts,
    getNextKey,
    updateContact,
} from "../controllers/contacts.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const contactsRouter = Router();

contactsRouter.get("/next-key", [authenticate], getNextKey);
contactsRouter.post("/",        [authenticate], createContact);
contactsRouter.get("/",         [authenticate], getContacts);
contactsRouter.get("/:id",      [authenticate], getContactById);
contactsRouter.patch("/:id",    [authenticate], updateContact);
contactsRouter.delete("/:id",   [authenticate, requireAdmin], deleteContact);

export default contactsRouter;

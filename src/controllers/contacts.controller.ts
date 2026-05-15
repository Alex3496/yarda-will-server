import { Request, Response } from "express";
import Contact from "../models/contact.model";

/**
 * @function getNextKey
 * @description Returns the next available contact key without persisting a record.
 */
export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Contact.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("CT-", ""), 10) + 1
            : 1;
        const key = `CT-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createContact
 * @description Creates a new contact. The key is auto-generated via a pre-save hook.
 */
export const createContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, phone } = req.body as { name?: string; phone?: string };
        const contact = await Contact.create({ name, phone });
        res.status(201).json({ contact });
    } catch (_error) {
        res.status(400).json({ message: "Error creating contact" });
    }
};

/**
 * @function getContacts
 * @description Retrieves a paginated list of contacts with optional search on key, name and phone.
 */
export const getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip  = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        const search = req.query.search as string | undefined;
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [{ key: regex }, { name: regex }, { phone: regex }];
        }

        const [contacts, total] = await Promise.all([
            Contact.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
            Contact.countDocuments(filter),
        ]);

        res.status(200).json({ data: contacts, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving contacts" });
    }
};

/**
 * @function getContactById
 * @description Retrieves a single contact by its MongoDB ID.
 */
export const getContactById = async (req: Request, res: Response): Promise<void> => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }
        res.status(200).json({ contact });
    } catch (_error) {
        res.status(400).json({ message: "Invalid contact ID" });
    }
};

/**
 * @function updateContact
 * @description Updates the name and/or phone of a contact by its MongoDB ID.
 */
export const updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, phone } = req.body as { name?: string; phone?: string };
        const updateData: Record<string, unknown> = {};
        if (name  !== undefined) updateData.name  = name;
        if (phone !== undefined) updateData.phone = phone;

        const contact = await Contact.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!contact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }

        res.status(200).json({ contact });
    } catch (_error) {
        res.status(400).json({ message: "Error updating contact" });
    }
};

/**
 * @function deleteContact
 * @description Deletes a contact by its MongoDB ID. Requires admin role.
 */
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }
        res.status(200).json({ message: "Contact deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid contact ID" });
    }
};

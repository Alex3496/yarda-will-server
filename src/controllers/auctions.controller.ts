import { Request, Response } from "express";
import Auction from "../models/auction.model";

interface PopulatedRegion {
    _id: string;
    key: string;
    name: string;
}

export const getNextKey = async (_req: Request, res: Response): Promise<void> => {
    try {
        const last = await Auction.findOne({}, { key: 1 }).sort({ key: -1 });
        const nextNumber = last
            ? Number.parseInt(last.key.replace("S-", ""), 10) + 1
            : 1;
        const key = `S-${String(nextNumber).padStart(6, "0")}`;
        res.status(200).json({ key });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving next key" });
    }
};

/**
 * @function createAuction
 * @description Creates a new auction. The key is auto-generated via a pre-save hook.
 */
export const createAuction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, regionId } = req.body as { name?: string; regionId?: string };
        const auction = await Auction.create({ name, region_id: regionId || undefined });
        await auction.populate("region_id", "key name");
        res.status(201).json({ auction });
    } catch (_error) {
        res.status(400).json({ message: "Error creating auction" });
    }
};

/**
 * @function getAuctions
 * @description Retrieves a paginated list of auctions with optional search on key and name.
 */
export const getAuctions = async (req: Request, res: Response): Promise<void> => {
    try {
        const page  = parseInt(req.query.page  as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip  = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        const regionId = req.query.region_id as string | undefined;
        if (regionId?.trim()) {
            filter.region_id = regionId.trim();
        }

        const search = req.query.search as string | undefined;
        if (search?.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [{ key: regex }, { name: regex }];
        }

        const [auctions, total] = await Promise.all([
            Auction.find(filter)
                .populate("region_id", "key name")
                .sort({ key: 1 })
                .skip(skip)
                .limit(limit),
            Auction.countDocuments(filter),
        ]);

        res.status(200).json({ data: auctions, total, page, limit });
    } catch (_error) {
        res.status(500).json({ message: "Error retrieving auctions" });
    }
};

/**
 * @function getAuctionById
 * @description Retrieves a single auction by its MongoDB ID.
 */
export const getAuctionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate("region_id", "key name");
        if (!auction) {
            res.status(404).json({ message: "Auction not found" });
            return;
        }
        res.status(200).json({ auction });
    } catch (_error) {
        res.status(400).json({ message: "Invalid auction ID" });
    }
};

/**
 * @function updateAuction
 * @description Updates the name of an auction by its MongoDB ID.
 */
export const updateAuction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, regionId } = req.body as { name?: string; regionId?: string };
        const updateData: Record<string, unknown> = {};
        if (name      !== undefined) updateData.name      = name;
        if (regionId  !== undefined) updateData.region_id = regionId;

        const auction = await Auction.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).populate("region_id", "key name");

        if (!auction) {
            res.status(404).json({ message: "Auction not found" });
            return;
        }

        res.status(200).json({ auction });
    } catch (_error) {
        res.status(400).json({ message: "Error updating auction" });
    }
};

/**
 * @function deleteAuction
 * @description Deletes an auction by its MongoDB ID. Requires admin role.
 */
export const deleteAuction = async (req: Request, res: Response): Promise<void> => {
    try {
        const auction = await Auction.findByIdAndDelete(req.params.id);
        if (!auction) {
            res.status(404).json({ message: "Auction not found" });
            return;
        }
        res.status(200).json({ message: "Auction deleted successfully" });
    } catch (_error) {
        res.status(400).json({ message: "Invalid auction ID" });
    }
};

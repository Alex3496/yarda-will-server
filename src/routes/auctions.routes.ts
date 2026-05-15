import { Router } from "express";
import {
    createAuction,
    deleteAuction,
    getAuctionById,
    getAuctions,
    getNextKey,
    updateAuction,
} from "../controllers/auctions.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const auctionsRouter = Router();

auctionsRouter.get("/next-key", [authenticate], getNextKey);
auctionsRouter.post("/",        [authenticate], createAuction);
auctionsRouter.get("/",         [authenticate], getAuctions);
auctionsRouter.get("/:id",      [authenticate], getAuctionById);
auctionsRouter.patch("/:id",    [authenticate], updateAuction);
auctionsRouter.delete("/:id",   [authenticate, requireAdmin], deleteAuction);

export default auctionsRouter;

import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import {
    getOpenLoanKey,
    getLoanKeysByOperation,
    createLoanKey,
    closeLoanKey,
    deleteLoanKey,
} from "../controllers/loanKeys.controller";

const loanKeysRouter = Router();

loanKeysRouter.get("/open",   [authenticate], getOpenLoanKey);
loanKeysRouter.get("/",       [authenticate], getLoanKeysByOperation);
loanKeysRouter.post("/",      [authenticate], createLoanKey);
loanKeysRouter.patch("/:id",  [authenticate], closeLoanKey);
loanKeysRouter.delete("/:id", [authenticate, requireAdmin], deleteLoanKey);

export default loanKeysRouter;

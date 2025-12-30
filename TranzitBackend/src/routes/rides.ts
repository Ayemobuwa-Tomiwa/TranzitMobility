import { Router } from "express";

const router = Router();

router.get("/:userId", (req, res) => {
    const { userId } = req.params;

    res.json({
        rides: [],
        userId,
    });
});

export default router;

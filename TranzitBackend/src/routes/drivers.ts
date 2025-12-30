import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.json({
        data: [
            {
                id: 1,
                latitude: 6.5244,
                longitude: 3.3792,
                title: "Driver 1",
            },
            {
                id: 2,
                latitude: 6.528,
                longitude: 3.37,
                title: "Driver 2",
            },
        ],
    });
});

export default router;

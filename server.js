const express = require("express");
const cors = require("cors");
const path = require("path");

const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getAuth } = require("firebase-admin/auth");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ======================================
// Middleware
// ======================================
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ======================================
// Firebase initialization
// ======================================
try {
    const serviceAccountPath = path.resolve(
        __dirname,
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        "./firebase-service-account.json"
    );

    const serviceAccount = require(serviceAccountPath);

    initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log("Firebase Admin initialized successfully");

} catch (error) {
    console.error("Firebase initialization failed:", error.message);
    process.exit(1);
}

// ======================================
// Helper: validate attendance date
// ======================================
function isValidDate(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        return false;
    }

    const [year, month, date] = day.split("-").map(Number);

    if (year < 2000 || year > 2100) {
        return false;
    }

    const parsedDate = new Date(
        Date.UTC(year, month - 1, date)
    );

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === date
    );
}

// ======================================
// Helper: verify Firebase ID token
// ======================================
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const match = authHeader.match(/^Bearer\s+(.+)$/i);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const decodedToken = await getAuth().verifyIdToken(
            match[1],
            true
        );

        req.user = decodedToken;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
}

// ======================================
// Helper: verify teacher permissions
// ======================================
async function verifyTeacher(req, res, next) {
    try {
        const snapshot = await getDatabase()
            .ref("teachers/" + req.user.uid)
            .get();

        if (!snapshot.exists()) {
            return res.status(403).json({
                success: false,
                message: "Teacher permission required"
            });
        }

        next();

    } catch (error) {
        console.error("Teacher verification failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not verify teacher permissions"
        });
    }
}

// ======================================
// Home API
// ======================================
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Attendance System Backend is running"
    });
});

// ======================================
// Health check
// ======================================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "online",
        message: "Backend is running"
    });
});

// ======================================
// Firebase connection test
// ======================================
app.get("/api/firebase-status", async (req, res) => {
    try {
        const snapshot = await getDatabase()
            .ref("teachers")
            .limitToFirst(1)
            .get();

        res.json({
            success: true,
            firebase: "connected",
            teachersDataExists: snapshot.exists()
        });

    } catch (error) {
        console.error("Firebase read failed:", error.message);

        res.status(500).json({
            success: false,
            firebase: "connection_failed",
            message: "Could not read from Firebase"
        });
    }
});

// ======================================
// Verify current user's identity
// ======================================
app.get("/api/auth/verify", verifyToken, async (req, res) => {
    try {
        const teacherSnapshot = await getDatabase()
            .ref("teachers/" + req.user.uid)
            .get();

        res.json({
            success: true,
            uid: req.user.uid,
            isTeacher: teacherSnapshot.exists()
        });

    } catch (error) {
        console.error("Identity verification failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not verify user identity"
        });
    }
});

// ======================================
// Get all students - teacher only
// ======================================
app.get(
    "/api/students",
    verifyToken,
    verifyTeacher,
    async (req, res) => {
        try {
            const snapshot = await getDatabase()
                .ref("students")
                .get();

            const students = snapshot.exists()
                ? snapshot.val()
                : {};

            res.json({
                success: true,
                count: Object.keys(students).length,
                students
            });

        } catch (error) {
            console.error("Failed to read students:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to retrieve students"
            });
        }
    }
);

// ======================================
// Get attendance records - teacher only
// ======================================
app.get(
    "/api/attendance",
    verifyToken,
    verifyTeacher,
    async (req, res) => {
        try {
            const snapshot = await getDatabase()
                .ref("attendance")
                .get();

            res.json({
                success: true,
                attendance: snapshot.exists()
                    ? snapshot.val()
                    : {}
            });

        } catch (error) {
            console.error("Failed to read attendance:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to retrieve attendance"
            });
        }
    }
);

// ======================================
// Get one student's attendance - teacher only
// ======================================
app.get(
    "/api/attendance/:uid",
    verifyToken,
    verifyTeacher,
    async (req, res) => {
        try {
            const uid = req.params.uid;

            if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            const snapshot = await getDatabase()
                .ref("attendance/" + uid)
                .get();

            res.json({
                success: true,
                uid,
                attendance: snapshot.exists()
                    ? snapshot.val()
                    : {}
            });

        } catch (error) {
            console.error(
                "Failed to read student attendance:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: "Failed to retrieve student attendance"
            });
        }
    }
);

// ======================================
// Update attendance status - teacher only
// ======================================
app.put(
    "/api/attendance/:uid/:day",
    verifyToken,
    verifyTeacher,
    async (req, res) => {
        try {
            const { uid, day } = req.params;
            const { status, note = "" } = req.body || {};

            if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            if (!isValidDate(day)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date"
                });
            }

            const allowedStatuses = [
                "present",
                "absent",
                "late",
                "excused"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attendance status"
                });
            }

            if (typeof note !== "string" || note.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid note"
                });
            }

            const studentSnapshot = await getDatabase()
                .ref("students/" + uid)
                .get();

            if (!studentSnapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            const record = {
                status,
                date: day,
                time: status === "present"
                    ? new Date().toLocaleTimeString("en-GB", {
                        timeZone: "Asia/Riyadh",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    })
                    : "",
                method: "teacher",
                note: note.trim()
            };

            await getDatabase()
                .ref(`attendance/${uid}/${day}`)
                .set(record);

            res.json({
                success: true,
                message: "Attendance updated successfully",
                record
            });

        } catch (error) {
            console.error("Failed to update attendance:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to update attendance"
            });
        }
    }
);

// ======================================
// Delete attendance record - teacher only
// ======================================
app.delete(
    "/api/attendance/:uid/:day",
    verifyToken,
    verifyTeacher,
    async (req, res) => {
        try {
            const { uid, day } = req.params;

            if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            if (!isValidDate(day)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date"
                });
            }

            const recordRef = getDatabase()
                .ref(`attendance/${uid}/${day}`);

            const snapshot = await recordRef.get();

            if (!snapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance record not found"
                });
            }

            await recordRef.remove();

            res.json({
                success: true,
                message: "Attendance record deleted"
            });

        } catch (error) {
            console.error("Failed to delete attendance:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to delete attendance record"
            });
        }
    }
);

// ======================================
// Unknown API routes
// ======================================
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ======================================
// Home page
// ======================================
app.get("/", (req, res) => {
    res.redirect("/teacher_login.html");
});
// Static files
app.use("/firebase-service-account.json", (req, res) => {
    res.sendStatus(404);
});

app.use("/server.js", (req, res) => {
    res.sendStatus(404);
});

app.use(express.static(__dirname));
// ======================================
// Handle other routes
// ======================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ======================================
// Start server
// ======================================
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});

// ======================================
// Global Error Handler
// ======================================
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});
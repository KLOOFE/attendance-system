const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Attendance System Backend");
});

app.get("/students", (req, res) => {
    res.json([
        {
            id: 1,
            name: "Ahmed"
        },
        {
            id: 2,
            name: "Mohammed"
        }
    ]);
});

app.listen(3000, () => {
    console.log("Teacher Dashboard:");
    console.log("http://localhost:5500/attendance-system-master/teacher.html");
});
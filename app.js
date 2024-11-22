const exress = require("express");
const app = express();
app.get("/", (req, res) => {
    res.send("html")
});

app.listen(8000, () => {
    console.log("server started at port 8000");
})
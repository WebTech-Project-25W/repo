const express = require("express");
const cors = require("cors");
const express = require("express");
const cors = require("cors");

const app = express();

//CORS fix for Angular (minimal change)
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.static("public"));
app.use(express.json());

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const customerRoutes = require("./routes/customer");
const restaurantOwnerRoutes = require("./routes/restaurantOwner");
const authenticate = require("./middleware/authenticate");
const authorise = require("./middleware/authorise");
const publicRoutes = require("./routes/public");
app.use("/public", publicRoutes);

app.use("/auth", authRoutes);
app.use("/admin", authenticate, authorise(["SiteManager"]), adminRoutes);
app.use("/customer", authenticate, authorise(["Customer"]), customerRoutes);
app.use(
  "/owner",
  authenticate,
  authorise(["RestaurantOwner"]),
  restaurantOwnerRoutes
);

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("Our amazing food delivery app!");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

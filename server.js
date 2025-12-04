// -------------------------
// Imports
// -------------------------
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { philosophies } from "./data/philosophies.js";

// -------------------------
// App setup
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------------
// Middleware
// -------------------------

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Cache static assets for 1 day
app.use(express.static("public", { maxAge: "1d" }));

// Parse cookies
app.use(cookieParser());

// Global logger + device detector
app.use((req, res, next) => {
  const now = new Date().toISOString();
  const ua = req.headers["user-agent"] || "";
  const deviceType = /mobile/i.test(ua) ? "Mobile" : "Desktop";

  console.log(`[${now}] ${req.method} ${req.path} — ${deviceType}`);

  res.locals.requestTime = now;
  res.locals.deviceType = deviceType;
  next();
});

// Remember last visited philosopher (global)
app.use((req, res, next) => {
  const last = req.cookies?.lastPhilosopher || null;
  res.locals.lastPhilosopher = last;
  next();
});

// Parse URL-encoded form data (required for POST forms)
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Routes
// -------------------------

// Home Page
app.get("/", (req, res) => {
  res.render("index", { title: "Philosophy Hub" });
});

// Philosophers List
app.get("/philosophers", (req, res) => {
  const philosophers = [
    { name: "Socrates", img: "/phlimages/socrates.jpg" },
    { name: "Marcus Aurelius", img: "/phlimages/marcus_aurelius.jpg" },
    { name: "Aristotle", img: "/phlimages/aristotle.jpg" },
    { name: "Epictetus", img: "/phlimages/epictetus.jpg" },
    { name: "Epicurus", img: "/phlimages/epicurus.jpg" },
    { name: "Thales of Miletus", img: "/phlimages/thales_of_miletus.jpg" },
    { name: "Plato", img: "/phlimages/plato.jpg" },
    { name: "Friedrich Nietzsche", img: "/phlimages/friedrich_nietzsche.jpg" },
    { name: "Immanuel Kant", img: "/phlimages/immanuel_kant.jpg" },
    { name: "John Locke", img: "/phlimages/john_locke.jpg" },
    { name: "Thomas Hobbes", img: "/phlimages/thomas_hobbes.jpg" },
    { name: "David Hume", img: "/phlimages/david_hume.jpg" },
    { name: "Jean-Jacques Rousseau", img: "/phlimages/jeanjacques_rousseau.jpg" },
    { name: "Confucius", img: "/phlimages/confucius.jpg" },
    { name: "Laozi", img: "/phlimages/laozi_lao_tzu.jpg" },
    { name: "Zhuangzi", img: "/phlimages/zhuangzi_chuang_tzu.jpg" },
    { name: "Mencius", img: "/phlimages/mencius_mengzi.jpg" },
    { name: "Rene Descartes", img: "/phlimages/rene_descartes.jpg" },
    { name: "Baruch Spinoza", img: "/phlimages/baruch_spinoza.jpg" },
    { name: "Voltaire", img: "/phlimages/voltaire.jpg" },
  ];
  res.render("philosophers", { title: "Philosophers", philosophers });
});

// Individual Philosopher Page (dynamic)
app.get("/philosophers/:name", (req, res) => {
  const philosopherName = req.params.name;

  // store last visited philosopher
  res.cookie("lastPhilosopher", philosopherName, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
  });

  res.render("philosopher-profile", {
    title: philosopherName,
    philosopherName,
  });
});

// Philosophies List
app.get("/philosophies", (req, res) => {
  res.render("philosophies", { 
    title: "Philosophies",
    philosophies 
  });
});

// Individual Philosophy Page (dynamic)
app.get("/philosophies/:name", (req, res) => {
  const selected = req.params.name;

  let foundCategory = null;
  let foundDescription = null;

  for (let category in philosophies) {
    if (philosophies[category][selected]) {
      foundCategory = category;
      foundDescription = philosophies[category][selected];
      break;
    }
  }

  if (!foundDescription) {
    return res.status(404).render("404", { title: "Philosophy Not Found" });
  }

  res.render("philosophy-details", {
    title: selected,
    name: selected,
    category: foundCategory,
    description: foundDescription,
  });
});

// Articles
app.get("/articles", (req, res) => {
  res.render("articles", { title: "Articles" });
});

// Quotes
app.get("/quotes", (req, res) => {
  res.render("quotes", { title: "Daily Quotes" });
});


// Favorite Philosopher Form POST route
app.use(express.urlencoded({ extended: true })); // must be above routes

app.post("/form", (req, res) => {
  const name = req.body.philosopher;
  if (!name) return res.status(400).send("Please enter a philosopher.");
  res.cookie("lastPhilosopher", name, { maxAge: 15 * 60 * 1000, httpOnly: true });
  res.render("result", { title: "Your Favorite Philosopher", name: name });
});

// Temporary 500 test
app.get("/test500", async (req, res, next) => {
  try {
    throw new Error("Intentional test error for 500 page.");
  } catch (err) {
    next(err);  
  }
});

// temp test route for 404
app.get("/trigger-404", (req, res, next) => {
  // Skip to the 404 middleware
  next();
});

// 404 handler
// 404 catch-all (must be last)
app.use((req, res) => {
  res.status(404).render("404", { 
    title: "Page Not Found",
    url: req.originalUrl 
  });
});


// 500 Error Handler (must be last)
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  
  console.error("SERVER ERROR:", err);

  res.status(500).render("500", {
    siteTitle: "Server Error",
    message: isProd ? "Something went wrong." : err.message,
    stack: isProd ? null : err.stack
  });
});


// -------------------------
// Start Server
// -------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
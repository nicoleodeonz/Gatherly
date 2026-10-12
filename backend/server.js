const crypto = require("node:crypto");
const path = require("node:path");
const { promisify } = require("node:util");
const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const scrypt = promisify(crypto.scrypt);
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "Admin123!");
const passwordSpecialCharacters = "!@#$%^&*()_+-=[]{}|;:'\",.<>/?~`";
const emailJsServiceId = process.env.EMAILJS_SERVICE_ID;
const emailJsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
const emailJsPrivateKey = process.env.EMAILJS_PRIVATE_KEY;
const emailJsTicketTemplateId = process.env.EMAILJS_TICKET_TEMPLATE_ID || "template_3lusa0s";
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;
const payMongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
const payMongoWebhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
const publicAppUrl = process.env.PUBLIC_APP_URL || "http://127.0.0.1:5173";
const emailJsTemplateId = "template_gyx5ecm";
const verificationLifetimeMs = 10 * 60 * 1000;
const verificationResendDelayMs = 60 * 1000;
const verificationMaxAttempts = 5;
const eventCodeCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

if (!mongoUri) {
  throw new Error("MONGODB_URI must be set in the environment.");
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 characters.");
}

if (adminPassword.length < 8) {
  throw new Error("ADMIN_PASSWORD must be set to at least 8 characters.");
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });
let databasePromise;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
  return { passwordHash, passwordSalt: salt };
}

async function verifyPassword(password, account) {
  if (!account?.passwordHash || !account.passwordSalt) {
    return false;
  }
  const candidateHash = await scrypt(password, account.passwordSalt, 64);
  const storedHash = Buffer.from(account.passwordHash, "hex");
  return candidateHash.length === storedHash.length && crypto.timingSafeEqual(candidateHash, storedHash);
}

function getDatabase() {
  if (!databasePromise) {
    databasePromise = client.connect()
      .then(async () => {
        const database = client.db("Gatherly");
        const customerAccounts = database.collection("customer_accounts");
        const adminAccounts = database.collection("admin_accounts");
        await customerAccounts.createIndex({ email: 1 }, { unique: true });
        await adminAccounts.createIndex({ email: 1 }, { unique: true });
        await database.collection("email_verifications").createIndex({ email: 1 }, { unique: true });
        await database.collection("email_verifications").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        const adminPasswordFields = await hashPassword(adminPassword);
        await adminAccounts.updateOne(
          { email: adminEmail },
          {
            $setOnInsert: {
              name: "Gatherly Admin",
              email: adminEmail,
              ...adminPasswordFields,
              createdAt: new Date(),
            },
          },
          { upsert: true },
        );
        await database.collection("events").createIndex({ ownerId: 1 });
        await database.collection("events").createIndex({ eventCode: 1 }, { unique: true, sparse: true });
        await database.collection("ticket_orders").createIndex({ ownerId: 1 });
        await database.collection("attendees").createIndex({ ownerId: 1 });
        await database.collection("attendees").createIndex(
          { eventId: 1, email: 1 },
          { unique: true, partialFilterExpression: { eventId: { $type: "objectId" }, email: { $type: "string" } } },
        );
        await database.collection("payment_registrations").createIndex({ statusToken: 1 }, { unique: true });
        await database.collection("payment_registrations").createIndex({ number: 1 }, { unique: true });
        await database.collection("payment_registrations").createIndex({ checkoutSessionId: 1 }, { sparse: true });
        await database.collection("payment_registrations").createIndex(
          { eventId: 1, email: 1 },
          { unique: true, partialFilterExpression: { status: "Pending" } },
        );
        await database.collection("registration_email_outbox").createIndex({ orderNumber: 1 }, { unique: true });
        await database.collection("registration_email_outbox").createIndex({ status: 1, createdAt: 1 });
        return database;
      })
      .catch((error) => {
        databasePromise = undefined;
        throw error;
      });
  }

  return databasePromise;
}

app.use(express.json({
  limit: "32kb",
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.use(cookieParser());
app.use(async (req, res, next) => {
  try {
    req.db = await getDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(503).json({ error: "Database unavailable. Please try again later." });
  }
});

app.use("/api", (req, res, next) => {
  const origin = req.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const requestHost = req.get("x-forwarded-host") || req.get("host");
      const requestUrl = new URL(`http://${requestHost}`);
      const localHosts = ["localhost", "127.0.0.1", "::1"];
      const localDevelopmentRequest = process.env.NODE_ENV !== "production"
        && localHosts.includes(originUrl.hostname)
        && localHosts.includes(requestUrl.hostname);
      if (originUrl.host !== requestHost && !localDevelopmentRequest) {
        return res.status(403).json({ error: "Cross-origin requests are not allowed." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }
  next();
});

function setSessionCookie(res, userId, accountType) {
  const token = jwt.sign({ sub: userId, accountType }, jwtSecret, { algorithm: "HS256", expiresIn: "7d" });
  res.cookie("gatherly_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api",
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies.gatherly_session;
  if (!token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string"
      || !["customer", "admin"].includes(payload.accountType)) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }
    req.userId = payload.sub;
    req.accountType = payload.accountType;
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function serialize(document) {
  const { _id, ownerId, ...fields } = document;
  return { ...fields, id: _id.toString() };
}

function createEventCode() {
  return Array.from({ length: 7 }, () => eventCodeCharacters[crypto.randomInt(eventCodeCharacters.length)]).join("");
}

function objectId(value) {
  return typeof value === "string" && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function validString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function hasValidPasswordComplexity(password) {
  return /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && [...password].some((character) => passwordSpecialCharacters.includes(character));
}

function hashVerificationCode(email, code) {
  return crypto.createHmac("sha256", jwtSecret).update(`${email}:${code}`).digest("hex");
}

function isValidEmail(email) {
  return validString(email, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateEvent(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const multipleDay = body.multipleDay === true;
  const pricingMode = body.pricingMode;
  const priceCents = body.priceCents;
  const ticketTypes = Array.isArray(body.ticketTypes) ? body.ticketTypes : [];
  if (!validString(body.name, 120)
    || !validString(body.date, 40)
    || !validString(body.time, 40)
    || !validString(body.venue, 200)
    || !validString(body.description, 5000)
    || !validString(body.category, 100)
    || !validString(body.headliner, 150)
    || typeof body.multipleDay !== "boolean"
    || (multipleDay && (!isValidIsoDate(body.date) || !isValidIsoDate(body.endDate) || body.endDate <= body.date))
    || !Number.isInteger(body.total) || body.total < 1 || body.total > 100000
    || !["free", "single", "multiple"].includes(pricingMode)
    || (pricingMode === "single" && (!Number.isInteger(priceCents) || priceCents < 1 || priceCents > 100000000))
    || (pricingMode === "multiple" && (ticketTypes.length < 2 || ticketTypes.length > 10
      || ticketTypes.some((ticket) => !ticket || typeof ticket !== "object"
        || !validString(ticket.name, 80)
        || !Number.isInteger(ticket.priceCents) || ticket.priceCents < 1 || ticket.priceCents > 100000000)))) {
    return null;
  }

  const normalizedTicketTypes = pricingMode === "multiple"
    ? ticketTypes.map((ticket) => ({
      id: typeof ticket.id === "string" && /^[a-z0-9]{12}$/i.test(ticket.id) ? ticket.id : crypto.randomBytes(6).toString("hex"),
      name: ticket.name.trim(),
      priceCents: ticket.priceCents,
    }))
    : [];
  return {
    name: body.name.trim(),
    date: body.date,
    multipleDay,
    endDate: multipleDay ? body.endDate : "",
    time: body.time,
    venue: body.venue.trim(),
    description: body.description.trim(),
    category: body.category.trim(),
    headliner: body.headliner.trim(),
    total: body.total,
    pricingMode,
    priceCents: pricingMode === "single" ? priceCents : 0,
    ticketTypes: normalizedTicketTypes,
  };
}

const sampleEvents = [
  { name: "Manila Creatives Summit 2025", date: "18 Oct 2025", time: "9:00 AM", venue: "SMX Convention Center, Pasay", sold: 342, total: 500, status: "On sale" },
  { name: "Makati Founders Night", date: "24 Oct 2025", time: "7:30 PM", venue: "The Astbury, Makati", sold: 186, total: 250, status: "On sale" },
  { name: "Philippine Product Summit", date: "6 Nov 2025", time: "10:00 AM", venue: "Online event · Philippines", sold: 920, total: 1200, status: "Draft" },
  { name: "Cebu Creatives Morning", date: "15 Nov 2025", time: "8:30 AM", venue: "Ayala Center Cebu", sold: 98, total: 150, status: "On sale" },
];

async function seedSampleData(database, ownerId) {
  const sampleCollections = [
    ["events", sampleEvents],
    ["attendees", [
      { name: "Emman Agazon", event: "Manila Creatives Summit 2025", ticket: "VIP Pass", checkedIn: true },
      { name: "Nicole Macalalad", event: "Manila Creatives Summit 2025", ticket: "Regular", checkedIn: false },
      { name: "Jamie Anne Brizal", event: "Makati Founders Night", ticket: "Early Bird", checkedIn: false },
      { name: "Diomella Agustin", event: "Cebu Creatives Morning", ticket: "Regular", checkedIn: true },
    ]],
  ];

  for (const [collectionName, sampleRecords] of sampleCollections) {
    const collection = database.collection(collectionName);
    const existing = await collection.countDocuments({ ownerId });
    if (existing === 0) {
      await collection.insertMany(sampleRecords.map((record) => ({ ...record, ownerId })));
    }
  }
}

app.get("/api/health", async (req, res) => {
  await req.db.command({ ping: 1 });
  res.json({ status: "connected", database: "Gatherly" });
});

app.post("/api/auth/email-verification/send", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!validString(name, 100) || !isValidEmail(email)) {
    return res.status(400).json({ error: "Enter your name and a valid email address." });
  }
  if (!emailJsServiceId || !emailJsPublicKey) {
    return res.status(503).json({ error: "Email verification is not configured. Please contact support." });
  }

  if (await req.db.collection("email_verifications").findOne({ email, verified: true })) {
    return res.status(409).json({ error: "This email address is already verified." });
  }

  const existingAccount = await Promise.all([
    req.db.collection("customer_accounts").findOne({ email }, { projection: { _id: 1 } }),
    req.db.collection("admin_accounts").findOne({ email }, { projection: { _id: 1 } }),
  ]);
  if (existingAccount.some(Boolean)) {
    return res.status(409).json({ error: "Email is already registered, please log in to continue." });
  }

  const verifications = req.db.collection("email_verifications");
  const existingVerification = await verifications.findOne({ email });
  const now = new Date();
  if (existingVerification?.lastSentAt
    && now.getTime() - existingVerification.lastSentAt.getTime() < verificationResendDelayMs) {
    const retryAfterSeconds = Math.ceil(
      (verificationResendDelayMs - (now.getTime() - existingVerification.lastSentAt.getTime())) / 1000,
    );
    return res.status(429).json({
      error: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
      retryAfterSeconds,
    });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  let emailResponse;
  try {
    const emailJsPayload = {
      service_id: emailJsServiceId,
      template_id: emailJsTemplateId,
      user_id: emailJsPublicKey,
      template_params: {
        name,
        email,
        to_email: email,
        verification_code: code,
        expires_in: "10 minutes",
      },
    };
    if (emailJsPrivateKey) {
      emailJsPayload.accessToken = emailJsPrivateKey;
    }
    emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailJsPayload),
    });
  } catch (error) {
    console.error("EmailJS request failed:", error);
    return res.status(502).json({ error: "Unable to send the verification email. Please try again." });
  }
  if (!emailResponse.ok) {
    const providerMessage = await emailResponse.text();
    if (emailResponse.status === 403 && providerMessage.toLowerCase().includes("private key")) {
      console.error("EmailJS strict mode requires EMAILJS_PRIVATE_KEY.");
      return res.status(503).json({
        error: "Email verification requires an EmailJS private key. Configure EMAILJS_PRIVATE_KEY on the backend or disable strict mode in EmailJS.",
      });
    }
    if (emailResponse.status === 422 && providerMessage.toLowerCase().includes("recipients address is corrupted")) {
      console.error("EmailJS rejected the verification recipient address (HTTP 422).");
      return res.status(400).json({
        error: "EmailJS rejected the recipient address. Check the email address and the template's recipient field.",
      });
    }
    console.error(`EmailJS returned HTTP ${emailResponse.status}.`);
    return res.status(502).json({ error: "Unable to send the verification email. Please check the address and try again." });
  }

  await verifications.updateOne(
    { email },
    {
      $set: {
        codeHash: hashVerificationCode(email, code),
        expiresAt: new Date(now.getTime() + verificationLifetimeMs),
        lastSentAt: now,
        attempts: 0,
        verified: false,
      },
    },
    { upsert: true },
  );
  res.json({ message: "Verification code sent.", expiresIn: verificationLifetimeMs / 1000 });
});

app.post("/api/auth/email-verification/status", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const [verification, customerAccount, adminAccount] = await Promise.all([
    req.db.collection("email_verifications").findOne(
      { email, verified: true },
      { projection: { _id: 1 } },
    ),
    req.db.collection("customer_accounts").findOne({ email }, { projection: { _id: 1 } }),
    req.db.collection("admin_accounts").findOne({ email }, { projection: { _id: 1 } }),
  ]);
  res.json({
    verified: Boolean(verification),
    registered: Boolean(customerAccount || adminAccount),
  });
});

app.post("/api/auth/email-verification/verify", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const code = req.body?.code;
  if (!isValidEmail(email) || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid email and six-digit verification code." });
  }

  const verification = await req.db.collection("email_verifications").findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, verified: false, attempts: { $lt: verificationMaxAttempts } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!verification) {
    return res.status(400).json({ error: "The code is expired or invalid. Request a new code." });
  }

  const suppliedHash = Buffer.from(hashVerificationCode(email, code), "hex");
  const storedHash = Buffer.from(verification.codeHash, "hex");
  if (suppliedHash.length !== storedHash.length || !crypto.timingSafeEqual(suppliedHash, storedHash)) {
    return res.status(400).json({ error: "The verification code is incorrect." });
  }

  await req.db.collection("email_verifications").updateOne(
    { _id: verification._id, verified: false },
    {
      $set: { verified: true, verifiedAt: new Date() },
      $unset: { expiresAt: "" },
    },
  );
  res.json({ verified: true, email });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!validString(name, 100) || !validString(email, 254)
    || typeof password !== "string" || password.length < 8 || password.length > 128
    || !hasValidPasswordComplexity(password)) {
    return res.status(400).json({
      error: "Enter a name and valid email. Passwords must be 8–128 characters and include uppercase, lowercase, a digit, and a supported special character.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const existingAccount = await Promise.all([
    req.db.collection("customer_accounts").findOne({ email: normalizedEmail }, { projection: { _id: 1 } }),
    req.db.collection("admin_accounts").findOne({ email: normalizedEmail }, { projection: { _id: 1 } }),
  ]);
  if (existingAccount.some(Boolean)) {
    return res.status(409).json({ error: "Email is already registered, please log in to continue." });
  }

  const verification = await req.db.collection("email_verifications").findOne({
    email: normalizedEmail,
    verified: true,
  });
  if (!verification) {
    return res.status(400).json({ error: "Verify your email address before creating an account." });
  }

  const passwordFields = await hashPassword(password);
  const userId = new ObjectId();

  try {
    await req.db.collection("customer_accounts").insertOne({
      _id: userId,
      name: name.trim(),
      email: normalizedEmail,
      ...passwordFields,
      createdAt: new Date(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email is already registered, please log in to continue." });
    }
    throw error;
  }

  await seedSampleData(req.db, userId.toString());
  await req.db.collection("email_verifications").deleteOne({ _id: verification._id });
  setSessionCookie(res, userId.toString(), "customer");
  res.status(201).json({ user: { name: name.trim(), email: normalizedEmail, accountType: "customer" } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!validString(email, 254) || typeof password !== "string") {
    return res.status(400).json({ error: "Enter your email and password." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [adminAccount, customerAccount] = await Promise.all([
    req.db.collection("admin_accounts").findOne({ email: normalizedEmail }),
    req.db.collection("customer_accounts").findOne({ email: normalizedEmail }),
  ]);
  const candidates = [
    { account: adminAccount, accountType: "admin" },
    { account: customerAccount, accountType: "customer" },
  ];
  let authenticated;
  for (const candidate of candidates) {
    if (await verifyPassword(password, candidate.account)) {
      authenticated = candidate;
      break;
    }
  }
  if (!authenticated) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  setSessionCookie(res, authenticated.account._id.toString(), authenticated.accountType);
  res.json({
    user: {
      name: authenticated.account.name,
      email: authenticated.account.email,
      accountType: authenticated.accountType,
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("gatherly_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api" });
  res.status(204).end();
});

app.get("/api/auth/session", async (req, res) => {
  const token = req.cookies.gatherly_session;
  if (!token) {
    return res.json({ user: null });
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return res.json({ user: null });
  }
  const id = objectId(payload.sub);
  const accountType = payload.accountType;
  if (!id || !["customer", "admin"].includes(accountType)) {
    return res.json({ user: null });
  }
  const collection = accountType === "admin" ? "admin_accounts" : "customer_accounts";
  const user = await req.db.collection(collection).findOne(
    { _id: id },
    { projection: { name: 1, email: 1 } },
  );
  if (!user) {
    return res.json({ user: null });
  }
  res.json({ user: { name: user.name, email: user.email, accountType } });
});

function getPublicEvent(event) {
  return {
    eventCode: event.eventCode,
    name: event.name,
    date: event.date,
    endDate: event.endDate || "",
    multipleDay: event.multipleDay === true,
    time: event.time,
    venue: event.venue,
    description: event.description,
    category: event.category,
    headliner: event.headliner,
    total: event.total,
    sold: event.sold || 0,
    pricingMode: event.pricingMode || "free",
    priceCents: event.priceCents || 0,
    ticketTypes: event.ticketTypes || [],
    available: Math.max(0, event.total - (event.sold || 0) - (event.reserved || 0)),
  };
}

function getSelectedTicket(event, ticketTypeId) {
  if (event.pricingMode === "multiple") {
    return event.ticketTypes?.find((ticket) => ticket.id === ticketTypeId) || null;
  }
  if (event.pricingMode === "single" && ticketTypeId === "general") {
    return { id: "general", name: "General admission", priceCents: event.priceCents };
  }
  if ((!event.pricingMode || event.pricingMode === "free") && ticketTypeId === "free") {
    return { id: "free", name: "Free registration", priceCents: 0 };
  }
  return null;
}

function createOrderNumber() {
  return `G-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

async function reservePendingRegistration(database, event, registration) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const reservation = await database.collection("events").updateOne(
        {
          _id: event._id,
          status: "On sale",
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ["$sold", 0] }, { $ifNull: ["$reserved", 0] }, 1] },
              "$total",
            ],
          },
        },
        { $inc: { reserved: 1 } },
        { session },
      );
      if (reservation.modifiedCount !== 1) {
        throw new Error("EVENT_CAPACITY_REACHED");
      }
      const existingAttendee = await database.collection("attendees").findOne(
        { eventId: event._id, email: registration.email },
        { session, projection: { _id: 1 } },
      );
      if (existingAttendee) throw new Error("ATTENDEE_ALREADY_REGISTERED");
      await database.collection("payment_registrations").insertOne(registration, { session });
    });
  } finally {
    await session.endSession();
  }
}

async function createFreeRegistration(database, event, order, attendee) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const reservation = await database.collection("events").updateOne(
        {
          _id: event._id,
          status: "On sale",
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ["$sold", 0] }, { $ifNull: ["$reserved", 0] }, 1] },
              "$total",
            ],
          },
        },
        { $inc: { sold: 1 } },
        { session },
      );
      if (reservation.modifiedCount !== 1) throw new Error("EVENT_CAPACITY_REACHED");
      const existingAttendee = await database.collection("attendees").findOne(
        { eventId: event._id, email: attendee.email },
        { session, projection: { _id: 1 } },
      );
      if (existingAttendee) throw new Error("ATTENDEE_ALREADY_REGISTERED");
      const pendingRegistration = await database.collection("payment_registrations").findOne(
        { eventId: event._id, email: attendee.email, status: "Pending" },
        { session, projection: { _id: 1 } },
      );
      if (pendingRegistration) throw new Error("ATTENDEE_ALREADY_REGISTERED");
      await database.collection("ticket_orders").insertOne(order, { session });
      await database.collection("attendees").insertOne(attendee, { session });
      await database.collection("registration_email_outbox").insertOne({
        orderNumber: order.number,
        recipient: order.email,
        status: "Pending",
        attempts: 0,
        createdAt: order.createdAt,
        templateParams: {
          name: order.buyer,
          email: order.email,
          to_email: order.email,
          time: order.createdAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
          event_name: order.event,
          event_date: order.date,
          event_time: order.time,
          event_id: order.eventId.toString(),
          event_code: order.eventCode,
          ticket_type: order.ticket,
          event_venue: order.venue,
          amount: order.amount,
          transaction_id: "Not applicable (free registration)",
          tran_id: "Not applicable (free registration)",
        },
      }, { session });
    });
  } finally {
    await session.endSession();
  }
}

async function releasePendingRegistration(database, registration, status) {
  const session = client.startSession();
  let releasedRegistration = false;
  try {
    await session.withTransaction(async () => {
      const result = await database.collection("payment_registrations").updateOne(
        { _id: registration._id, status: "Pending" },
        { $set: { status, closedAt: new Date() } },
        { session },
      );
      if (result.modifiedCount !== 1) return;
      const released = await database.collection("events").updateOne(
        { _id: registration.eventId, ownerId: registration.ownerId, reserved: { $gte: 1 } },
        { $inc: { reserved: -1 } },
        { session },
      );
      if (released.modifiedCount !== 1) throw new Error("EVENT_RESERVATION_NOT_FOUND");
      releasedRegistration = true;
    });
    return releasedRegistration;
  } finally {
    await session.endSession();
  }
}

async function fulfillPaidOrder(database, sessionData) {
  const sessionId = sessionData?.id;
  const attributes = sessionData?.attributes;
  const referenceNumber = attributes?.reference_number;
  const paidPayment = Array.isArray(attributes?.payments)
    ? attributes.payments.find((payment) => payment.attributes?.status === "paid")
    : null;
  const paymentAttributes = paidPayment?.attributes || {};
  const transactionId = paidPayment?.id;
  if (!sessionId || !referenceNumber || !transactionId) {
    return false;
  }

  const session = client.startSession();
  try {
    let fulfilled = false;
    await session.withTransaction(async () => {
      const registrations = database.collection("payment_registrations");
      const registration = await registrations.findOne(
        { number: referenceNumber, checkoutSessionId: sessionId },
        { session },
      );
      if (!registration || registration.status !== "Pending") {
        return;
      }
      const paidAmount = Number.isInteger(paymentAttributes.net_amount)
        ? paymentAttributes.net_amount
        : paymentAttributes.amount;
      if (paidAmount !== registration.amountCents
        || paymentAttributes.currency?.toUpperCase() !== "PHP") {
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }
      const eventUpdate = await database.collection("events").updateOne(
        { _id: registration.eventId, ownerId: registration.ownerId, reserved: { $gte: 1 } },
        { $inc: { reserved: -1, sold: 1 } },
        { session },
      );
      if (eventUpdate.modifiedCount !== 1) {
        throw new Error("EVENT_RESERVATION_NOT_FOUND");
      }
      const paidAt = new Date();
      const order = {
        number: registration.number,
        buyer: registration.buyer,
        email: registration.email,
        event: registration.event,
        eventId: registration.eventId,
        eventCode: registration.eventCode,
        ticket: registration.ticket,
        ticketTypeId: registration.ticketTypeId,
        amountCents: registration.amountCents,
        amount: registration.amount,
        status: "Paid",
        transactionId,
        paymentIntentId: attributes.payment_intent?.id || "",
        checkoutSessionId: sessionId,
        ownerId: registration.ownerId,
        createdAt: registration.createdAt,
        paidAt,
      };
      const attendee = {
        name: registration.buyer,
        email: registration.email,
        event: registration.event,
        eventId: registration.eventId,
        eventCode: registration.eventCode,
        ticket: registration.ticket,
        ticketTypeId: registration.ticketTypeId,
        orderNumber: registration.number,
        transactionId,
        paymentIntentId: attributes.payment_intent?.id || "",
        amountCents: registration.amountCents,
        amount: registration.amount,
        date: registration.date,
        endDate: registration.endDate,
        time: registration.time,
        venue: registration.venue,
        category: registration.category,
        headliner: registration.headliner,
        description: registration.description,
        checkedIn: false,
        ownerId: registration.ownerId,
        createdAt: paidAt,
      };
      await database.collection("ticket_orders").insertOne(order, { session });
      await database.collection("attendees").insertOne(attendee, { session });
      await registrations.updateOne(
        { _id: registration._id, status: "Pending" },
        { $set: { status: "Paid", transactionId, paidAt } },
        { session },
      );
      await database.collection("registration_email_outbox").insertOne({
        orderNumber: registration.number,
        recipient: registration.email,
        status: "Pending",
        attempts: 0,
        createdAt: paidAt,
        templateParams: {
          name: registration.buyer,
          email: registration.email,
          to_email: registration.email,
          time: paidAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
          event_name: registration.event,
          event_date: registration.date,
          event_time: registration.time,
          event_id: registration.eventId.toString(),
          event_code: registration.eventCode,
          ticket_type: registration.ticket,
          event_venue: registration.venue,
          amount: registration.amount,
          transaction_id: transactionId,
          tran_id: transactionId,
        },
      }, { session });
      fulfilled = true;
    });
    return fulfilled;
  } finally {
    await session.endSession();
  }
}

async function sendRegistrationConfirmation(database, orderNumber) {
  const outbox = database.collection("registration_email_outbox");
  const now = new Date();
  const claimed = await outbox.findOneAndUpdate(
    {
      orderNumber,
      $or: [
        { status: "Pending", $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: now } }] },
        { status: "Sending", sendingAt: { $lte: new Date(now.getTime() - 2 * 60 * 1000) } },
      ],
    },
    { $set: { status: "Sending", sendingAt: now }, $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!claimed) return;
  if (!emailJsServiceId || !emailJsPublicKey || !emailJsPrivateKey || !emailJsTicketTemplateId) {
    console.error("Registration confirmation email is pending: configure the EmailJS ticket template and backend credentials.");
    await outbox.updateOne(
      { _id: claimed._id, status: "Sending" },
      { $set: { status: "Pending", nextAttemptAt: new Date(now.getTime() + 5 * 60 * 1000) }, $unset: { sendingAt: "" } },
    );
    return;
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: emailJsServiceId,
        template_id: emailJsTicketTemplateId,
        user_id: emailJsPublicKey,
        accessToken: emailJsPrivateKey,
        template_params: claimed.templateParams,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const providerResponse = await response.text();
      console.error(`Registration confirmation email failed with HTTP ${response.status}: ${providerResponse.slice(0, 500)}`);
      throw new Error("EmailJS rejected the registration confirmation.");
    }
    await outbox.updateOne(
      { _id: claimed._id, status: "Sending" },
      { $set: { status: "Sent", sentAt: new Date() }, $unset: { sendingAt: "", nextAttemptAt: "" } },
    );
  } catch (error) {
    console.error("Registration confirmation email delivery failed:", error);
    await outbox.updateOne(
      { _id: claimed._id, status: "Sending" },
      {
        $set: { status: "Pending", nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** claimed.attempts) * 60 * 1000) },
        $unset: { sendingAt: "" },
      },
    );
  }
}

async function processPendingRegistrationEmails(database) {
  const now = new Date();
  const pending = await database.collection("registration_email_outbox")
    .find({ status: "Pending", $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: now } }] })
    .project({ orderNumber: 1 })
    .limit(20)
    .toArray();
  for (const email of pending) {
    await sendRegistrationConfirmation(database, email.orderNumber);
  }
}

async function queueMissingRegistrationEmails(database) {
  const orders = await database.collection("ticket_orders")
    .find({ status: "Paid" })
    .project({
      number: 1,
      buyer: 1,
      email: 1,
      event: 1,
      eventId: 1,
      eventCode: 1,
      ticket: 1,
      date: 1,
      time: 1,
      venue: 1,
      amount: 1,
      transactionId: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  for (const order of orders) {
    if (!order.number || !order.email) {
      console.error("Cannot queue registration confirmation: paid order is missing its order number or attendee email.");
      continue;
    }
    const existingEmail = await database.collection("registration_email_outbox").findOne(
      { orderNumber: order.number },
      { projection: { _id: 1 } },
    );
    if (existingEmail) continue;

    try {
      await database.collection("registration_email_outbox").insertOne({
        orderNumber: order.number,
        recipient: order.email,
        status: "Pending",
        attempts: 0,
        createdAt: order.createdAt || new Date(),
        templateParams: {
          name: order.buyer,
          email: order.email,
          to_email: order.email,
          time: (order.createdAt || new Date()).toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
          event_name: order.event,
          event_date: order.date,
          event_time: order.time,
          event_id: order.eventId?.toString() || "",
          event_code: order.eventCode,
          ticket_type: order.ticket,
          event_venue: order.venue,
          amount: order.amount,
          transaction_id: order.transactionId || "Not applicable (free registration)",
          tran_id: order.transactionId || "Not applicable (free registration)",
        },
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
}

async function releaseExpiredPaymentRegistrations(database) {
  const expired = await database.collection("payment_registrations")
    .find({ status: "Pending", expiresAt: { $lte: new Date() } })
    .limit(50)
    .toArray();
  for (const registration of expired) {
    await releasePendingRegistration(database, registration, "Expired");
  }
}

app.get("/api/public/events/:eventCode", async (req, res) => {
  const event = await req.db.collection("events").findOne({
    eventCode: req.params.eventCode,
    status: "On sale",
  });
  if (!event) {
    return res.status(404).json({ error: "This published event could not be found." });
  }
  return res.json(getPublicEvent(event));
});

app.post("/api/public/events/:eventCode/register", async (req, res) => {
  const { name, email, ticketTypeId } = req.body || {};
  if (req.body?.quantity !== undefined) {
    return res.status(400).json({ error: "Only one ticket may be registered per person per event." });
  }
  if (!validString(name, 120) || !isValidEmail(email)
    || !validString(ticketTypeId, 32)) {
    return res.status(400).json({ error: "Enter a valid name, email, and ticket type." });
  }
  const event = await req.db.collection("events").findOne({
    eventCode: req.params.eventCode,
    status: "On sale",
  });
  if (!event) {
    return res.status(404).json({ error: "This published event could not be found." });
  }
  const ticket = getSelectedTicket(event, ticketTypeId);
  if (!ticket) {
    return res.status(400).json({ error: "Choose an available ticket type." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existingAttendee = await req.db.collection("attendees").findOne(
    { eventId: event._id, email: normalizedEmail },
    { projection: { _id: 1 } },
  );
  if (existingAttendee) {
    return res.status(409).json({ error: "This email is already registered for this event." });
  }

  const totalCents = ticket.priceCents;
  const orderNumber = createOrderNumber();
  const statusToken = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const registrationDetails = {
    number: orderNumber,
    statusToken,
    buyer: name.trim(),
    email: normalizedEmail,
    event: event.name,
    eventId: event._id,
    eventCode: event.eventCode,
    ticket: ticket.name,
    ticketTypeId: ticket.id,
    date: event.date,
    endDate: event.endDate || "",
    time: event.time,
    venue: event.venue,
    category: event.category,
    headliner: event.headliner,
    description: event.description,
    amountCents: totalCents,
    amount: new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalCents / 100),
    ownerId: event.ownerId,
    createdAt: now,
  };

  if (totalCents === 0) {
    const order = {
      ...registrationDetails,
      status: "Paid",
      transactionId: "",
      paymentIntentId: "",
    };
    const attendee = {
      name: registrationDetails.buyer,
      email: registrationDetails.email,
      event: event.name,
      eventId: event._id,
      eventCode: event.eventCode,
      ticket: ticket.name,
      ticketTypeId: ticket.id,
      orderNumber,
      transactionId: "",
      paymentIntentId: "",
      amountCents: totalCents,
      amount: registrationDetails.amount,
      date: event.date,
      endDate: event.endDate || "",
      time: event.time,
      venue: event.venue,
      category: event.category,
      headliner: event.headliner,
      description: event.description,
      checkedIn: false,
      ownerId: event.ownerId,
      createdAt: now,
    };
    try {
      await createFreeRegistration(req.db, event, order, attendee);
      await sendRegistrationConfirmation(req.db, orderNumber);
      const emailReceipt = await req.db.collection("registration_email_outbox").findOne(
        { orderNumber },
        { projection: { status: 1 } },
      );
      return res.status(201).json({ status: "Registered", orderNumber, emailStatus: emailReceipt?.status || "Pending" });
    } catch (error) {
      if (error.message === "EVENT_CAPACITY_REACHED") {
        return res.status(409).json({ error: "There are not enough tickets remaining." });
      }
      if (error.message === "ATTENDEE_ALREADY_REGISTERED" || error.code === 11000) {
        return res.status(409).json({ error: "This email is already registered for this event." });
      }
      throw error;
    }
  }

  if (!payMongoSecretKey?.startsWith("sk_test_")) {
    return res.status(503).json({ error: "PayMongo test mode is not configured. Add a test secret key on the server and try again." });
  }
  const registration = {
    ...registrationDetails,
    status: "Pending",
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
  };
  try {
    await reservePendingRegistration(req.db, event, registration);
  } catch (error) {
    if (error.message === "EVENT_CAPACITY_REACHED") {
      return res.status(409).json({ error: "There are not enough tickets remaining." });
    }
    if (error.message === "ATTENDEE_ALREADY_REGISTERED" || error.code === 11000) {
      return res.status(409).json({ error: "This email already has a registration in progress or is registered for this event." });
    }
    throw error;
  }

  const publicEventUrl = `${publicAppUrl.replace(/\/+$/, "")}/events/${encodeURIComponent(event.eventCode)}`;
  let paymentResponse;
  try {
    paymentResponse = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${payMongoSecretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{ name: `${event.name} — ${ticket.name}`, amount: ticket.priceCents, currency: "PHP", quantity: 1 }],
            payment_method_types: ["card", "gcash", "qrph", "paymaya"],
            success_url: `${publicEventUrl}?payment=success&order=${encodeURIComponent(statusToken)}`,
            cancel_url: `${publicEventUrl}?payment=cancelled&order=${encodeURIComponent(statusToken)}`,
            reference_number: orderNumber,
            send_email_receipt: false,
            metadata: { eventCode: event.eventCode, orderNumber, eventId: event._id.toString() },
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const responseBody = await paymentResponse.json();
    const checkoutUrl = responseBody.data?.attributes?.checkout_url;
    const checkoutSessionId = responseBody.data?.id;
    if (!paymentResponse.ok || !checkoutUrl || !checkoutSessionId) {
      console.error("PayMongo Checkout Session creation failed:", JSON.stringify(responseBody.errors || {}));
      throw new Error("Could not start PayMongo checkout. Please try again.");
    }
    const savedSession = await req.db.collection("payment_registrations").updateOne(
      { _id: registration._id, status: "Pending" },
      { $set: { checkoutSessionId } },
    );
    if (savedSession.modifiedCount !== 1) {
      throw new Error("Could not save the PayMongo Checkout Session.");
    }
    return res.status(201).json({ status: "Pending", checkoutUrl, orderToken: statusToken });
  } catch (error) {
    await releasePendingRegistration(req.db, registration, "Failed");
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(502).json({ error: "PayMongo checkout timed out. Please try again." });
    }
    if (error.message === "Could not start PayMongo checkout. Please try again.") {
      return res.status(502).json({ error: error.message });
    }
    console.error("PayMongo Checkout Session request failed:", error);
    return res.status(502).json({ error: "PayMongo checkout is temporarily unavailable. Please try again." });
  }
});

app.get("/api/public/orders/:orderNumber/status", async (req, res) => {
  let registration = await req.db.collection("payment_registrations").findOne(
    { statusToken: req.params.orderNumber },
    { projection: { number: 1, status: 1, eventCode: 1, ticket: 1, checkoutSessionId: 1, expiresAt: 1 } },
  );
  if (!registration) {
    return res.status(404).json({ error: "Registration not found." });
  }
  if (registration.status === "Pending" && registration.expiresAt <= new Date()) {
    const released = await releasePendingRegistration(req.db, registration, "Expired");
    if (released) {
      registration.status = "Expired";
    } else {
      registration = await req.db.collection("payment_registrations").findOne(
        { statusToken: req.params.orderNumber },
        { projection: { number: 1, status: 1, eventCode: 1, ticket: 1, checkoutSessionId: 1, expiresAt: 1 } },
      );
    }
  }
  if (registration.status === "Pending" && registration.checkoutSessionId && payMongoSecretKey?.startsWith("sk_test_")) {
    let response;
    try {
      response = await fetch(`https://api.paymongo.com/v2/checkout_sessions/${encodeURIComponent(registration.checkoutSessionId)}`, {
        headers: { Authorization: `Basic ${Buffer.from(`${payMongoSecretKey}:`).toString("base64")}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      console.error("PayMongo Checkout Session verification failed:", error);
      return res.status(502).json({ error: "Payment confirmation is temporarily unavailable. Please refresh shortly." });
    }
    if (!response.ok) {
      console.error(`PayMongo Checkout Session verification returned HTTP ${response.status}.`);
      return res.status(502).json({ error: "Payment confirmation is temporarily unavailable. Please refresh shortly." });
    }
    const checkoutSession = (await response.json()).data;
    await fulfillPaidOrder(req.db, checkoutSession);
    await sendRegistrationConfirmation(req.db, registration.number);
    registration = await req.db.collection("payment_registrations").findOne(
      { statusToken: req.params.orderNumber },
      { projection: { number: 1, status: 1, eventCode: 1, ticket: 1 } },
    );
  } else if (registration.status === "Paid") {
    await sendRegistrationConfirmation(req.db, registration.number);
  }
  const emailReceipt = registration.status === "Paid"
    ? await req.db.collection("registration_email_outbox").findOne(
      { orderNumber: registration.number },
      { projection: { status: 1 } },
    )
    : null;
  return res.json({
    orderNumber: registration.number,
    status: registration.status,
    eventCode: registration.eventCode,
    ticket: registration.ticket,
    emailStatus: emailReceipt?.status || "",
  });
});

app.post("/api/public/orders/:orderToken/cancel", async (req, res) => {
  const registration = await req.db.collection("payment_registrations").findOne({
    statusToken: req.params.orderToken,
  });
  if (!registration) {
    return res.status(404).json({ error: "Registration not found." });
  }
  if (registration.status !== "Pending") {
    return res.json({ cancelled: false, status: registration.status });
  }
  const cancelled = await releasePendingRegistration(req.db, registration, "Cancelled");
  if (!cancelled) {
    const latest = await req.db.collection("payment_registrations").findOne(
      { _id: registration._id },
      { projection: { status: 1 } },
    );
    return res.json({ cancelled: false, status: latest?.status || "Unknown" });
  }
  return res.json({ cancelled: true, status: "Cancelled" });
});

app.post("/api/webhooks/paymongo", async (req, res) => {
  if (!payMongoSecretKey?.startsWith("sk_test_") || !payMongoWebhookSecret || !Buffer.isBuffer(req.rawBody)) {
    return res.status(503).json({ error: "PayMongo webhook verification is not configured." });
  }
  const signatureHeader = req.get("paymongo-signature") || "";
  const signatureFields = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.trim().split("=", 2);
    return [key, value];
  }));
  const timestamp = Number(signatureFields.t);
  const receivedSignature = signatureFields.te;
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300
    || !/^[a-f0-9]{64}$/i.test(receivedSignature || "")) {
    return res.status(400).json({ error: "Invalid PayMongo webhook signature." });
  }
  const expectedSignature = crypto.createHmac("sha256", payMongoWebhookSecret)
    .update(`${timestamp}.${req.rawBody.toString("utf8")}`)
    .digest();
  const actualSignature = Buffer.from(receivedSignature, "hex");
  if (actualSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(actualSignature, expectedSignature)) {
    return res.status(400).json({ error: "Invalid PayMongo webhook signature." });
  }

  const eventData = req.body?.data;
  const attributes = eventData?.attributes;
  const eventType = attributes?.type || eventData?.type || req.body?.type;
  const checkoutSession = attributes?.data?.data || attributes?.data || eventData?.data;
  if (eventType === "checkout_session.payment.paid") {
    const fulfilled = await fulfillPaidOrder(req.db, checkoutSession);
    const referenceNumber = checkoutSession?.attributes?.reference_number;
    if (!fulfilled && referenceNumber) {
      const registration = await req.db.collection("payment_registrations").findOne(
        { number: referenceNumber, checkoutSessionId: checkoutSession.id },
        { projection: { status: 1 } },
      );
      if (!registration || registration.status !== "Paid") {
        return res.status(422).json({ error: "Paid checkout could not be matched to a registration." });
      }
    } else if (!referenceNumber) {
      return res.status(422).json({ error: "PayMongo checkout has no registration reference." });
    }
    await sendRegistrationConfirmation(req.db, referenceNumber);
  }
  return res.status(200).json({ received: true });
});

app.use("/api", requireAuth);

app.get("/api/places/autocomplete", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 3 || query.length > 200) {
    return res.json({ suggestions: [] });
  }
  if (!geoapifyApiKey) {
    return res.status(503).json({ error: "Venue suggestions are unavailable. Configure GEOAPIFY_API_KEY on the server." });
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query);
  url.searchParams.set("filter", "countrycode:ph");
  url.searchParams.set("limit", "6");
  url.searchParams.set("apiKey", geoapifyApiKey);

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (error) {
    console.error("Geoapify venue autocomplete request failed:", error);
    return res.status(502).json({ error: "Venue suggestions could not be reached. Please try again." });
  }
  if (!response.ok) {
    console.error(`Geoapify venue autocomplete returned HTTP ${response.status}.`);
    return res.status(502).json({ error: "Venue suggestions are temporarily unavailable. Please try again." });
  }

  const data = await response.json();
  const suggestions = Array.isArray(data.features)
    ? data.features
      .filter((feature) => feature.properties?.country_code?.toLowerCase() === "ph"
        && typeof feature.properties.formatted === "string")
      .map((feature) => feature.properties.formatted)
      .filter((venue, index, venues) => venues.indexOf(venue) === index)
      .slice(0, 6)
    : [];
  return res.json({ suggestions });
});

app.get("/api/events", async (req, res) => {
  const events = await req.db.collection("events").find({ ownerId: req.userId }).sort({ _id: -1 }).toArray();
  res.json(events.map(serialize));
});

app.post("/api/events", async (req, res) => {
  const values = validateEvent(req.body);
  if (!values) {
    return res.status(400).json({ error: "Enter valid event details, including a later end date for multiple-day events." });
  }

  const events = req.db.collection("events");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const event = { ...values, eventCode: createEventCode(), sold: 0, status: "Draft", ownerId: req.userId };
    try {
      const result = await events.insertOne(event);
      return res.status(201).json(serialize({ ...event, _id: result.insertedId }));
    } catch (error) {
      if (error.code !== 11000 || error.keyPattern?.eventCode !== 1) {
        throw error;
      }
    }
  }
  return res.status(503).json({ error: "Could not generate a unique event ID. Please try again." });
});

app.patch("/api/events/:id/publish", async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid event ID." });
  }

  const events = req.db.collection("events");
  const result = await events.findOneAndUpdate(
    { _id: id, ownerId: req.userId, status: "Draft" },
    { $set: { status: "On sale" } },
    { returnDocument: "after" },
  );
  if (!result) {
    const existingEvent = await events.findOne({ _id: id, ownerId: req.userId }, { projection: { status: 1 } });
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found." });
    }
    return res.status(409).json({ error: "This event is already published." });
  }
  return res.json(serialize(result));
});

app.patch("/api/events/:id", async (req, res) => {
  const id = objectId(req.params.id);
  const values = validateEvent(req.body);
  if (!id || !values) {
    return res.status(400).json({ error: "Enter valid event update details, including a later end date for multiple-day events." });
  }

  const result = await req.db.collection("events").findOneAndUpdate(
    { _id: id, ownerId: req.userId },
    { $set: values },
    { returnDocument: "after" },
  );
  if (!result) {
    return res.status(404).json({ error: "Event not found." });
  }
  res.json(serialize(result));
});

app.delete("/api/events/:id", async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid event ID." });
  }
  const result = await req.db.collection("events").deleteOne({ _id: id, ownerId: req.userId });
  if (!result.deletedCount) {
    return res.status(404).json({ error: "Event not found." });
  }
  res.status(204).end();
});

app.get("/api/orders", async (req, res) => {
  const orders = await req.db.collection("ticket_orders").find({ ownerId: req.userId }).sort({ _id: -1 }).toArray();
  res.json(orders.map(serialize));
});

app.patch("/api/orders/:id", async (req, res) => {
  const id = objectId(req.params.id);
  if (!id || req.body.status !== "Refunded") {
    return res.status(400).json({ error: "Invalid order update." });
  }
  const result = await req.db.collection("ticket_orders").findOneAndUpdate(
    { _id: id, ownerId: req.userId, status: "Paid" },
    { $set: { status: "Refunded" } },
    { returnDocument: "after" },
  );
  if (!result) {
    const order = await req.db.collection("ticket_orders").findOne(
      { _id: id, ownerId: req.userId },
      { projection: { status: 1, checkoutSessionId: 1 } },
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    return res.status(409).json({
      error: order.checkoutSessionId
        ? "PayMongo refunds must be processed through your PayMongo dashboard."
        : "Only paid orders can be marked as refunded.",
    });
  }
  res.json(serialize(result));
});

app.get("/api/attendees", async (req, res) => {
  const attendees = await req.db.collection("attendees").find({ ownerId: req.userId }).sort({ _id: 1 }).toArray();
  res.json(attendees.map(serialize));
});

app.patch("/api/attendees/:id", async (req, res) => {
  const id = objectId(req.params.id);
  if (!id || typeof req.body.checkedIn !== "boolean") {
    return res.status(400).json({ error: "Invalid attendee update." });
  }
  const result = await req.db.collection("attendees").findOneAndUpdate(
    { _id: id, ownerId: req.userId },
    { $set: { checkedIn: req.body.checkedIn } },
    { returnDocument: "after" },
  );
  if (!result) {
    return res.status(404).json({ error: "Attendee not found." });
  }
  res.json(serialize(result));
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({ error: "The request could not be completed." });
});

if (require.main === module) {
  getDatabase()
    .then(() => {
      const port = Number(process.env.PORT) || 5000;
      app.listen(port, () => console.log(`Gatherly API listening on port ${port}`));
      const maintenanceTimer = setInterval(() => {
        Promise.all([
          releaseExpiredPaymentRegistrations(client.db("Gatherly")),
          queueMissingRegistrationEmails(client.db("Gatherly"))
            .then(() => processPendingRegistrationEmails(client.db("Gatherly"))),
        ]).catch((error) => console.error("Registration maintenance failed:", error));
      }, 30000);
      maintenanceTimer.unref();
      queueMissingRegistrationEmails(client.db("Gatherly"))
        .then(() => processPendingRegistrationEmails(client.db("Gatherly")))
        .catch((error) => console.error("Unable to recover pending registration emails:", error));
    })
    .catch((error) => {
      console.error("Unable to connect to the Gatherly database:", error);
      process.exitCode = 1;
    });
}

module.exports = app;

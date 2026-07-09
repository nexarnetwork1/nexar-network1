const PDFDocument = require("pdfkit");
const fs = require("fs");

const INPUT = "./public/whitepaper.txt";
const OUTPUT = "./public/whitepaper.pdf";

const text = fs.readFileSync(INPUT, "utf8");

const GOLD = "#D4AF37";
const WHITE = "#FFFFFF";
const GRAY = "#B8B8B8";
const BLACK = "#0A0A0A";

const doc = new PDFDocument({
  size: "A4",
  margin: 60,
  autoFirstPage: false,
  info: {
    Title: "Nexar Network Whitepaper",
    Author: "Nexar Network",
    Subject: "Blockchain Payment Infrastructure",
    Creator: "Nexar Network",
  },
});

doc.pipe(fs.createWriteStream(OUTPUT));

function addDarkPage() {
  doc.addPage({
    margin: 60,
  });

  doc.save();

  doc.rect(
    0,
    0,
    doc.page.width,
    doc.page.height
  ).fill(BLACK);

  doc.restore();

  doc.fillColor(WHITE);
  doc.font("Helvetica");
  doc.fontSize(11);

  doc.x = 60;
  doc.y = 60;
}

function ensureSpace(height = 30) {
  if (doc.y + height > doc.page.height - 60) {
    addDarkPage();
  }
}

function heading(text) {
  ensureSpace(60);

  doc.moveDown();

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(GOLD)
    .text(text);

  doc.moveDown(0.5);

  doc
    .strokeColor(GOLD)
    .lineWidth(1)
    .moveTo(60, doc.y)
    .lineTo(535, doc.y)
    .stroke();

  doc.moveDown();

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(WHITE);
}

function subHeading(text) {
  ensureSpace(40);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(GOLD)
    .text(text);

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(WHITE);
}

function paragraph(text) {
  const h = doc.heightOfString(text, {
    width: 475,
    align: "justify",
    lineGap: 5,
  });

  ensureSpace(h + 20);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(WHITE)
    .text(text, {
      width: 475,
      align: "justify",
      lineGap: 5,
    });

  doc.moveDown(0.5);
}

function bullet(text) {
  const h = doc.heightOfString("• " + text, {
    width: 455,
    indent: 15,
    lineGap: 4,
  });

  ensureSpace(h + 15);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(WHITE)
    .text("• " + text, {
      width: 455,
      indent: 15,
      lineGap: 4,
    });

  doc.moveDown(0.2);
}

function cover() {
  addDarkPage();

  doc.y = 120;

  doc
    .font("Helvetica-Bold")
    .fontSize(34)
    .fillColor(GOLD)
    .text("NEXAR NETWORK", {
      align: "center",
    });

  doc.moveDown();

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(WHITE)
    .text("WHITEPAPER", {
      align: "center",
    });

  doc.moveDown();

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor(GRAY)
    .text("Building the Future of Global Payments", {
      align: "center",
    });

  doc.moveDown(2);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(GOLD)
    .text("Fast • Secure • Transparent • Scalable", {
      align: "center",
    });

  addDarkPage();
}

cover();

const lines = text.split(/\r?\n/);

for (const raw of lines) {

  const line = raw.trim();

  if (!line) {
    doc.moveDown(0.4);
    continue;
  }

  // تجاهل خطوط ==== و ----
  if (/^=+$/.test(line) || /^-+$/.test(line)) {
    continue;
  }

  // عناوين رئيسية (1. TITLE)
  if (/^\d+\./.test(line)) {
    heading(line);
    continue;
  }

  // PHASE
  if (/^PHASE/i.test(line)) {
    subHeading(line);
    continue;
  }

  // نقاط
  if (
    line.startsWith("•") ||
    line.startsWith("-")
  ) {
    bullet(line.replace(/^[-•]\s*/, ""));
    continue;
  }

  // عناوين قصيرة بحروف كبيرة
  if (
    line === line.toUpperCase() &&
    line.length < 40 &&
    !line.includes(".")
  ) {
    subHeading(line);
    continue;
  }

  // نص عادي
  paragraph(line);
}

console.log("Whitepaper generated.");

doc.end();

console.log("");
console.log("======================================");
console.log(" Nexar Whitepaper Generated");
console.log(" Output: ./public/whitepaper.pdf");
console.log("======================================");
console.log("");

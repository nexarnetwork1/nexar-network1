const PDFDocument = require('pdfkit');
const fs = require('fs');

const whitepaperContent = fs.readFileSync('./public/whitepaper.txt', 'utf-8');
const lines = whitepaperContent.split('\n');

const doc = new PDFDocument({
  margin: 60,
  size: 'A4',
  info: {
    Title: 'Nexar Network Technical Whitepaper',
    Author: 'Nexar Network',
    Subject: 'Decentralized Payment Infrastructure',
    Keywords: 'blockchain, payments, NXR, BNB Smart Chain',
  }
});

doc.pipe(fs.createWriteStream('./public/whitepaper.pdf'));

// Cover page
doc.fontSize(32)
   .fillColor('#D4AF37')
   .font('Helvetica-Bold')
   .text('NEXAR NETWORK', { align: 'center' })
   .moveDown(0.5);

doc.fontSize(18)
   .fillColor('#666')
   .font('Helvetica')
   .text('Technical Whitepaper', { align: 'center' })
   .moveDown(1);

doc.fontSize(12)
   .fillColor('#999')
   .text('Version 1.0', { align: 'center' })
   .moveDown(0.3)
   .text('July 2026', { align: 'center' })
   .moveDown(2);

doc.fontSize(10)
   .fillColor('#666')
   .text('Decentralized Payment Infrastructure', { align: 'center' })
   .moveDown(3);

doc.fontSize(9)
   .fillColor('#999')
   .text('nexar.network', { align: 'center' });

doc.addPage();

let y = 80;
let currentPage = 2;
const pageHeight = doc.page.height;
const marginBottom = 60;

function checkPageSpace(neededSpace = 30) {
  if (y + neededSpace > pageHeight - marginBottom) {
    // Add page number before new page
    doc.fontSize(9)
       .fillColor('#999')
       .text(`Page ${currentPage}`, 50, pageHeight - 40, { align: 'center' });
    
    doc.addPage();
    y = 80;
    currentPage++;
  }
}

// Add page number function
function addPageNumber() {
  doc.fontSize(9)
     .fillColor('#999')
     .text(`Page ${currentPage}`, 50, pageHeight - 40, { align: 'center' });
}

// Process content
let inSection = false;
let sectionTitle = '';

lines.forEach((line, index) => {
  if (line.trim() === '') {
    y += 8;
    return;
  }

  // Check for section headers (all caps with dashes)
  if (line.match(/^[A-Z\s\-]+$/) && line.length > 5) {
    checkPageSpace(50);
    doc.fontSize(16)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text(line.trim(), { align: 'left' })
       .moveDown(0.6);
    y = doc.y;
    inSection = true;
    return;
  }

  // Check for subsection headers (all caps shorter)
  if (line.match(/^[A-Z\s]+$/) && line.length > 2 && line.length < 30 && !line.includes('-')) {
    checkPageSpace(35);
    doc.fontSize(13)
       .fillColor('#F5E39E')
       .font('Helvetica-Bold')
       .text(line.trim(), { align: 'left' })
       .moveDown(0.4);
    y = doc.y;
    return;
  }

  // Check for list items (starting with -)
  if (line.trim().startsWith('-')) {
    checkPageSpace(20);
    doc.fontSize(11)
       .fillColor('#333')
       .font('Helvetica')
       .text(line.trim(), {
       align: 'left',
       width: doc.page.width - 120,
       lineGap: 4,
       indent: 20
    });
    y = doc.y;
    return;
  }

  // Regular content
  checkPageSpace(25);
  doc.fontSize(11)
     .fillColor('#333')
     .font('Helvetica')
     .text(line.trim(), {
       align: 'left',
       width: doc.page.width - 120,
       lineGap: 5
     });
  y = doc.y;
});

// Add final page number
addPageNumber();

doc.end();

console.log('Whitepaper PDF generated successfully at ./public/whitepaper.pdf');

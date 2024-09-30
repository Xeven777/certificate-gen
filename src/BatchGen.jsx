import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from "@pdf-lib/fontkit";
import { useState } from "react";

export const BatchGen = () => {
  const [userNames, setUserNames] = useState("");
  const fontUrl = "/DancingScript-Variable.ttf";

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase(),
    );

  const generatePDF = async (name) => {
    let nameLength = name.length;
    if (nameLength > 30)
      return alert("Name too long. Retry with a shorter name");
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    const existingPdfBytes = await fetch("./certificate1.pdf").then((res) =>
      res.arrayBuffer(),
    );
    const fontSize = nameLength > 20 ? 48 : 60;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const customFont = await pdfDoc.embedFont(fontBytes);
    const pageSize = firstPage.getSize();
    const textWidth = customFont.widthOfTextAtSize(name, fontSize);
    const textHeight = customFont.heightAtSize(fontSize);
    const pageWidth = pageSize.width;
    const pageHeight = pageSize.height;

    firstPage.drawText(name, {
      x: pageWidth / 2 - textWidth / 2,
      y: pageHeight / 2 - textHeight / 2,
      size: fontSize,
      font: customFont,
      color: rgb(0.576, 0.463, 0.008),
    });

    const pdfBytes = await pdfDoc.save();
    console.log("Done creating");

    var file = new File(
      [pdfBytes],
      `${name}-Certificate-${(Math.random() * 1000000).toPrecision(6)}.pdf`,
      {
        type: "application/pdf;charset=utf-8",
      },
    );
    saveAs(file);
  };

  const handleSubmit = () => {
    const names = userNames
      .split(",")
      .map((name) => capitalize(name.replace(/"/g, "").trim()));

    if (names.length > 0 && names[0] !== "") {
      names.forEach((name) => {
        generatePDF(name);
      });
    } else {
      alert("Enter at least one name correctly");
    }
  };

  return (
    <div className="Gen">
      <h1>Certificate Generator</h1>
      <input
        type="text"
        id="names"
        placeholder="Enter names separated by commas"
        value={userNames}
        onChange={(e) => setUserNames(e.target.value)}
      />
      <button id="submitBtn" onClick={handleSubmit}>
        Generate PDFs
      </button>
    </div>
  );
};

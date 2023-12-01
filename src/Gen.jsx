import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from "@pdf-lib/fontkit";
import { useState } from "react";

const Gen = () => {
  const [userName, setUserName] = useState("");
  const fontUrl = "/DancingScript-Variable.ttf";

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );

  const generatePDF = async (name) => {
    let nameLength = name.length;
    if (nameLength > 30)
      return alert("Name too long. Retry with a shorter name");
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    const existingPdfBytes = await fetch("./certificate1.pdf").then((res) =>
      res.arrayBuffer()
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

    var file = new File([pdfBytes], "Certificate.pdf", {
      type: "application/pdf;charset=utf-8",
    });
    saveAs(file);
  };

  const handleSubmit = () => {
    const val = capitalize(userName);

    if (val.trim() !== "") {
      generatePDF(val);
    } else {
      alert("Enter your name correctly");
    }
  };

  return (
    <div className="Gen">
      <h1>Certificate Generator</h1>
      <input
        type="text"
        id="name"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <button id="submitBtn" onClick={handleSubmit}>
        Generate PDF
      </button>
    </div>
  );
};

export default Gen;

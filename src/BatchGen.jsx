import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from "@pdf-lib/fontkit";

export const BatchGen = () => {
  const [userNames, setUserNames] = useState("");
  const [textColor, setTextColor] = useState("#93760E");
  const [fontSize, setFontSize] = useState(60);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [templateFile, setTemplateFile] = useState(null);

  const fontUrl = "/DancingScript-Variable.ttf";

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );

  const generatePDF = async (name) => {
    try {
      let nameLength = name.length;
      if (nameLength > 30) {
        throw new Error("Name too long. Retry with a shorter name");
      }

      const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
      const existingPdfBytes = templateFile
        ? await templateFile.arrayBuffer()
        : await fetch("./certificate1.pdf").then((res) => res.arrayBuffer());

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
        x: pageWidth / 2 - textWidth / 2 + xOffset,
        y: pageHeight / 2 - textHeight / 2 + yOffset,
        size: fontSize,
        font: customFont,
        color: rgb(
          ...textColor.match(/\w\w/g).map((c) => parseInt(c, 16) / 255)
        ),
      });

      const pdfBytes = await pdfDoc.save();
      const file = new File(
        [pdfBytes],
        `${name}-Certificate-${(Math.random() * 1000000).toPrecision(6)}.pdf`,
        {
          type: "application/pdf;charset=utf-8",
        }
      );
      saveAs(file);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    const names = userNames
      .split(",")
      .map((name) => capitalize(name.replace(/"/g, "").trim()));

    if (names.length > 0 && names[0] !== "") {
      setProgress(0);
      setError("");
      for (let i = 0; i < names.length; i++) {
        await generatePDF(names[i]);
        setProgress(((i + 1) / names.length) * 100);
      }
    } else {
      setError("Enter at least one name correctly");
    }
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setTemplateFile(file);
    } else {
      setError("Please upload a valid PDF file");
    }
  };

  return (
    <div className="Gen">
      <h1>Certificate Generator</h1>

      <textarea
        placeholder="Enter names separated by commas"
        value={userNames}
        onChange={(e) => setUserNames(e.target.value)}
      />

      <input
        type="color"
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
      />

      <input
        type="number"
        placeholder="Font Size"
        value={fontSize}
        onChange={(e) => setFontSize(parseInt(e.target.value))}
      />

      <input
        type="number"
        placeholder="X Offset"
        value={xOffset}
        onChange={(e) => setXOffset(parseInt(e.target.value))}
      />

      <input
        type="number"
        placeholder="Y Offset"
        value={yOffset}
        onChange={(e) => setYOffset(parseInt(e.target.value))}
      />

      <div className="file-upload">
        <input type="file" accept=".pdf" onChange={handleTemplateUpload} />
        {templateFile && <span>{templateFile.name}</span>}
      </div>

      <button onClick={handleSubmit}>Generate PDFs</button>

      {progress > 0 && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

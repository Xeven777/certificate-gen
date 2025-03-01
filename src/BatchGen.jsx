import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from "@pdf-lib/fontkit";
import {
  Upload,
  Users,
  Palette,
  Type,
  MoveHorizontal,
  MoveVertical,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "./BatchGen.css";

export const BatchGen = () => {
  const [userNames, setUserNames] = useState("");
  const [textColor, setTextColor] = useState("#93760E");
  const [fontSize, setFontSize] = useState(60);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      setIsGenerating(true);

      try {
        for (let i = 0; i < names.length; i++) {
          await generatePDF(names[i]);
          setProgress(((i + 1) / names.length) * 100);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsGenerating(false);
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
    <div className="certificate-generator">
      <div className="header">
        <h1>Certificate Generator</h1>
        <p className="subtitle">Create personalized certificates in seconds</p>
      </div>

      <div className="generator-container">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="templateUpload" className="file-upload">
              <div className="upload-box">
                <Upload size={32} className="upload-icon" />
                <span className="upload-text">
                  {templateFile ? templateFile.name : "Upload Template PDF"}
                </span>
              </div>
              <input
                id="templateUpload"
                type="file"
                accept=".pdf"
                onChange={handleTemplateUpload}
              />
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="names" className="input-group">
              <div className="input-label">
                <Users size={18} />
                <span className="label-text">Names</span>
              </div>
              <textarea
                id="names"
                placeholder="Enter names separated by commas"
                value={userNames}
                onChange={(e) => setUserNames(e.target.value)}
              />
            </label>
          </div>

          <div className="form-group text-settings">
            <div className="section-header">
              <FileText size={20} />
              <h3>Text Settings</h3>
            </div>

            <div className="form-row two-columns">
              <label htmlFor="fontsize" className="input-group">
                <div className="input-label">
                  <Type size={18} />
                  <span className="label-text">Font Size</span>
                </div>
                <input
                  id="fontsize"
                  min="10"
                  max="100"
                  type="number"
                  placeholder="Font Size"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                />
              </label>
              
              <label htmlFor="color" className="input-group color-picker">
                <div className="input-label">
                  <Palette size={18} />
                  <span className="label-text">Text Color</span>
                </div>
                <div className="color-input-container">
                  <input
                    type="color"
                    id="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                  <span className="color-value">{textColor}</span>
                </div>
              </label>
            </div>

            <div className="form-row two-columns">
              <label htmlFor="xOffset" className="input-group">
                <div className="input-label">
                  <MoveHorizontal size={18} />
                  <span className="label-text">X Offset</span>
                </div>
                <input
                  id="xOffset"
                  type="number"
                  placeholder="X Offset"
                  value={xOffset}
                  onChange={(e) => setXOffset(parseInt(e.target.value))}
                />
              </label>

              <label htmlFor="yOffset" className="input-group">
                <div className="input-label">
                  <MoveVertical size={18} />
                  <span className="label-text">Y Offset</span>
                </div>
                <input
                  id="yOffset"
                  type="number"
                  placeholder="Y Offset"
                  value={yOffset}
                  onChange={(e) => setYOffset(parseInt(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="action-section">
            <button
              className="generate-btn"
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Certificates"}
            </button>
          </div>
        </div>
      </div>

      {progress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            <CheckCircle2 size={16} className="progress-icon" />
            {Math.round(progress)}% Complete
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
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
  Download,
  Eye,
  X,
  Archive,
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
  const [success, setSuccess] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFont, setSelectedFont] = useState(
    "DancingScript-Variable.ttf"
  );
  const [downloadOption, setDownloadOption] = useState("individual");

  const fonts = [
    { name: "Dancing Script", value: "DancingScript-Variable.ttf" },
    { name: "Open Sans", value: "OpenSans-Variable.ttf" },
    { name: "Playfair Display", value: "PlayfairDisplay-Regular.ttf" },
    { name: "Montserrat", value: "Montserrat-Regular.ttf" },
    { name: "Roboto", value: "Roboto-Regular.ttf" },
  ];

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );

  const getFontUrl = () => {
    return `/${selectedFont}`;
  };

  const generatePDF = async (name, saveFile = true) => {
    try {
      let nameLength = name.length;
      if (nameLength > 30) {
        throw new Error("Name too long. Retry with a shorter name");
      }

      const fontBytes = await fetch(getFontUrl()).then((res) =>
        res.arrayBuffer()
      );
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

      const filename = `${name}-Certificate-${(
        Math.random() * 1000000
      ).toPrecision(6)}.pdf`;

      if (saveFile) {
        const file = new File([pdfBytes], filename, {
          type: "application/pdf;charset=utf-8",
        });

        if (downloadOption === "individual") {
          saveAs(file);
        } else {
          // Return for bulk download
          return { name: filename, data: pdfBytes };
        }
      }

      return pdfBytes;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    const names = userNames
      .split(",")
      .map((name) => capitalize(name.replace(/"/g, "").trim()))
      .filter((name) => name.length > 0);

    if (names.length > 0) {
      setProgress(0);
      setError("");
      setSuccess("");
      setIsGenerating(true);

      const pdfsToSave = [];

      try {
        for (let i = 0; i < names.length; i++) {
          if (downloadOption === "bulk") {
            const pdf = await generatePDF(names[i], false);
            if (pdf) {
              pdfsToSave.push({ name: names[i], data: pdf });
            }
          } else {
            await generatePDF(names[i]);
          }
          setProgress(((i + 1) / names.length) * 100);
        }

        if (downloadOption === "bulk" && pdfsToSave.length > 0) {
          await createAndDownloadZip(pdfsToSave);
        }

        setSuccess(
          `Successfully generated ${names.length} certificate${
            names.length > 1 ? "s" : ""
          }!`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setIsGenerating(false);
      }
    } else {
      setError("Enter at least one name");
    }
  };

  const createAndDownloadZip = async (pdfs) => {
    const zip = new JSZip();

    pdfs.forEach((pdf) => {
      const filename = `${pdf.name}-Certificate.pdf`;
      zip.file(filename, pdf.data);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const zipFile = new File(
      [content],
      `Certificates-${new Date().toISOString().slice(0, 10)}.zip`,
      { type: "application/zip" }
    );
    saveAs(zipFile);
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setTemplateFile(file);
      setSuccess(`Template "${file.name}" uploaded successfully`);
      // Generate preview immediately after upload
      generateTemplatePreview(file);
    } else if (file) {
      setError("Please upload a valid PDF file");
    }
  };

  const generateTemplatePreview = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const url = URL.createObjectURL(file);

        // Clean up previous URL if it exists
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(url);
        setShowPreview(true);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(`Template preview failed: ${err.message}`);
    }
  };

  const generatePreview = async () => {
    if (!userNames.trim()) {
      setError("Please enter at least one name for preview");
      return;
    }

    const firstNameInList = userNames.split(",")[0].trim();
    if (!firstNameInList) {
      setError("Please enter a valid name for preview");
      return;
    }

    try {
      const pdfBytes = await generatePDF(firstNameInList, false);

      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(url);
        setShowPreview(true);
      }
    } catch (err) {
      setError(`Preview generation failed: ${err.message}`);
    }
  };
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="certificate-generator">
      <div className="header">
        <h1>Certificate Generator</h1>
        <p className="subtitle">Create personalized certificates in seconds</p>
      </div>

      <div className="generator-container">
        <div className="form-section">
          {/* Template Upload */}
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

          {/* Names Input */}
          <div className="form-group">
            <label htmlFor="names" className="input-group">
              <div className="input-label">
                <Users size={18} />
                <span className="label-text">Names</span>
              </div>
              <textarea
                id="names"
                placeholder="Enter names separated by commas (e.g., John Doe, Jane Smith)"
                value={userNames}
                onChange={(e) => setUserNames(e.target.value)}
              />
            </label>
          </div>

          {/* Text Settings */}
          <div className="form-card">
            <div className="card-header">
              <FileText size={20} />
              <h3>Text Settings</h3>
            </div>

            <div className="card-content">
              <div className="form-row">
                {/* Font Selection */}
                <label htmlFor="font" className="input-group">
                  <div className="input-label">
                    <Type size={18} />
                    <span className="label-text">Font</span>
                  </div>
                  <select
                    id="font"
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="font-selector"
                  >
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row two-columns">
                {/* Font Size */}
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
                    onChange={(e) =>
                      setFontSize(parseInt(e.target.value) || 60)
                    }
                  />
                </label>

                {/* Text Color */}
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

              {/* Position Adjustment */}
              <div className="section-header">
                <MoveHorizontal size={18} />
                <h3>Position Adjustment</h3>
              </div>

              <div className="form-row two-columns position-inputs">
                {/* X Offset */}
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
                    onChange={(e) => setXOffset(parseInt(e.target.value) || 0)}
                  />
                </label>

                {/* Y Offset */}
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
                    onChange={(e) => setYOffset(parseInt(e.target.value) || 0)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="form-card">
            <div className="card-header">
              <Download size={20} />
              <h3>Download Options</h3>
            </div>

            <div className="card-content">
              <div className="download-option-selector">
                <label
                  className={`option ${
                    downloadOption === "individual" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="downloadOption"
                    value="individual"
                    checked={downloadOption === "individual"}
                    onChange={() => setDownloadOption("individual")}
                  />
                  <FileText size={16} />
                  <span>Individual PDFs</span>
                </label>

                <label
                  className={`option ${
                    downloadOption === "bulk" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="downloadOption"
                    value="bulk"
                    checked={downloadOption === "bulk"}
                    onChange={() => setDownloadOption("bulk")}
                  />
                  <Archive size={16} />
                  <span>Zip Archive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <button
              className="preview-btn"
              onClick={generatePreview}
              disabled={isGenerating}
            >
              <Eye size={18} />
              Preview
            </button>

            <button
              className="generate-btn"
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download size={18} />
                  Generate Certificates
                </>
              )}
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

      {success && (
        <div className="success-message">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      {showPreview && previewUrl && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div
            className="preview-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-header">
              <h3>Certificate Preview</h3>
              <button
                className="close-preview"
                onClick={() => setShowPreview(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="preview-content">
              <iframe
                src={previewUrl}
                title="Certificate Preview"
                className="preview-frame"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

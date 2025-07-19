import React, { useState, useRef, useEffect } from 'react';
import FloatingNavbar from '../components/FloatingNavbar';
import './TryDemo.css';

const TryDemo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [schema, setSchema] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('schema');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Supported file types
  const supportedFormats = ['csv', 'json', 'xlsx'];

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      processFile(e.dataTransfer.files[0]);
    }
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('drag-over');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      processFile(e.target.files[0]);
    }
  };

  // Process the uploaded file
  const processFile = (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExt || !supportedFormats.includes(fileExt)) {
      alert('Unsupported file format. Please upload a CSV, JSON, or Excel file.');
      return;
    }

    setFile(file);
    setFileName(file.name);
    setIsAnalyzing(true);
    setProgress(0);
    setSchema(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Simulate analysis progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            generateSchema(content, fileExt);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    };
    
    if (fileExt === 'json') {
      reader.readAsText(file);
    } else {
      // For CSV/Excel, we'd use a proper parser in real implementation
      reader.readAsText(file);
    }
  };

  // Generate schema from file content
  const generateSchema = (content: string, fileType: string) => {
    setTimeout(() => {
      let sampleData: any[] = [];
      let generatedSchema: any = {};
      
      if (fileType === 'json') {
        try {
          const jsonData = JSON.parse(content);
          sampleData = Array.isArray(jsonData) ? jsonData.slice(0, 5) : [jsonData];
          
          if (sampleData.length > 0) {
            generatedSchema = {
              collectionName: fileName.replace(/\.[^/.]+$/, "").toLowerCase(),
              fields: {}
            };
            
            Object.keys(sampleData[0]).forEach(key => {
              const value = sampleData[0][key];
              generatedSchema.fields[key] = detectType(value);
            });
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      } else if (fileType === 'csv') {
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        sampleData = lines.slice(1, 6).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, i) => {
            obj[header.trim()] = values[i]?.trim();
            return obj;
          }, {} as any);
        });
        
        if (sampleData.length > 0) {
          generatedSchema = {
            collectionName: fileName.replace(/\.[^/.]+$/, "").toLowerCase(),
            fields: {}
          };
          
          Object.keys(sampleData[0]).forEach(key => {
            const value = sampleData[0][key];
            generatedSchema.fields[key] = detectType(value);
          });
        }
      }
      
      setPreviewData(sampleData);
      setSchema(generatedSchema);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Detect MongoDB type from value
  const detectType = (value: any): any => {
    if (value === null || value === undefined) {
      return { type: 'Mixed' };
    }
    if (!isNaN(Number(value))) {
      return { type: 'Number' };
    } else if (typeof value === 'boolean') {
      return { type: 'Boolean' };
    } else if (!isNaN(Date.parse(value))) {
      return { type: 'Date' };
    } else if (typeof value === 'object') {
      return { type: 'Object' };
    } else {
      return { type: 'String' };
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('drag-over');
    }
  };

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('drag-over');
    }
  };

  // Copy schema to clipboard
  const copyToClipboard = () => {
  if (!schema) return;
  let schemaText = '';
  
  if (activeTab === 'schema') {
    schemaText = `const ${schema.collectionName}Schema = new mongoose.Schema({\n` +
      Object.entries(schema.fields).map(([field, config]: [string, any]) => {
        return `  ${field}: { type: ${config.type}${config.required ? ', required: true' : ''}${config.default ? `, default: ${config.default}` : ''} },\n`;
      }).join('') + '});';
  } else if (activeTab === 'code') {
    schemaText = `const mongoose = require('mongoose');\n\n` +
      `// Connect to MongoDB\n` +
      `mongoose.connect('mongodb://localhost:27017/${schema.collectionName}', {\n` +
      `  useNewUrlParser: true,\n` +
      `  useUnifiedTopology: true\n` +
      `});\n\n` +
      `// Define Schema\n` +
      `const ${schema.collectionName}Schema = new mongoose.Schema({\n` +
      Object.entries(schema.fields).map(([field, config]: [string, any]) => {
        return `  ${field}: { type: ${config.type}${config.required ? ', required: true' : ''}${config.default ? `, default: ${config.default}` : ''} },\n`;
      }).join('') + `});\n\n` +
      `// Create Model\n` +
      `const ${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)} = mongoose.model(\n` +
      `  '${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)}', \n` +
      `  ${schema.collectionName}Schema\n` +
      `);\n\n` +
      `module.exports = ${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)};`;
  }
  
  navigator.clipboard.writeText(schemaText);
  alert('Copied to clipboard!');
};

  // Reset the demo
  const resetDemo = () => {
    setFile(null);
    setFileName('');
    setSchema(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="try-demo-page">
      <FloatingNavbar />
      
      <div className="demo-container">
        <div className="hero-section">
          <h1 className="hero-title">
            <span className="title-gradient">Transform</span> Your Data
          </h1>
          <p className="hero-subtitle">
            Upload any dataset and instantly generate a MongoDB schema with AI-powered analysis
          </p>
        </div>

        <div 
          className={`upload-card ${file ? 'file-selected' : ''}`}
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!file ? (
            <div className="upload-content">
              <div className="upload-icon">
                <div className="pulse-circle"></div>
                <div className="pulse-circle delay-1"></div>
                <svg viewBox="0 0 24 24" className="upload-svg">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </div>
              <h3 className="upload-title">Drag & Drop Your File</h3>
              <p className="upload-description">Supported formats: CSV, JSON, Excel</p>
              <button 
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json,.xlsx"
                hidden
              />
            </div>
          ) : (
            <div className="file-preview">
              <div className="file-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <div className="file-details">
                <h4>{fileName}</h4>
                <div className="file-progress">
                  <div className="progress-track">
                    <div 
                      className="progress-thumb"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span>{progress}%</span>
                </div>
              </div>
              <button className="reset-button" onClick={resetDemo}>
                <svg viewBox="0 0 24 24">
                  <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="analysis-section">
            <div className="analysis-content">
              <h3>Analyzing Your Dataset</h3>
              <div className="analysis-animation">
                <div className="orb">
                  <div className="inner-orb"></div>
                </div>
                <div className="ripple"></div>
                <div className="ripple delay-1"></div>
                <div className="ripple delay-2"></div>
              </div>
              <p className="analysis-text">
                Our AI is scanning your data structure and detecting patterns...
              </p>
            </div>
          </div>
        )}

        {schema && (
          <div className="results-section">
            <div className="results-tabs">
              <button 
                className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Data Preview
              </button>
              <button 
                className={`tab-button ${activeTab === 'schema' ? 'active' : ''}`}
                onClick={() => setActiveTab('schema')}
              >
                MongoDB Schema
              </button>
              <button 
                className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Node.js Code
              </button>
            </div>

            <div className="results-content">
              {activeTab === 'preview' && (
                <div className="data-preview">
                  <div className="preview-header">
                    <h4>First 5 Rows Preview</h4>
                    <div className="badge-group">
                      <span className="badge">{previewData.length} rows</span>
                      <span className="badge">{Object.keys(previewData[0]).length} columns</span>
                    </div>
                  </div>
                  <div className="preview-table-container">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(previewData[0]).map((key) => (
                            <th key={key}>
                              <span>{key}</span>
                              <span className="type-badge">{detectType(previewData[0][key]).type}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => (
                              <td key={j}>
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'schema' && (
                <div className="schema-output">
                  <div className="schema-header">
                    <h4>Generated MongoDB Schema</h4>
                    <button 
                      className="copy-button"
                      onClick={copyToClipboard}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                      </svg>
                      Copy Schema
                    </button>
                  </div>
                  <div className="schema-container">
                    <pre>
                      <code>
                        {`const ${schema.collectionName}Schema = new mongoose.Schema({\n`}
                        {Object.entries(schema.fields).map(([field, config]: [string, any]) => (
                          <span key={field}>
                            {`  ${field}: { type: ${config.type}`}
                            {config.required && ', required: true'}
                            {config.default && `, default: ${config.default}`}
                            {' },\n'}
                          </span>
                        ))}
                        {'});'}
                      </code>
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="code-output">
                  <div className="code-header">
                    <h4>Node.js Implementation Code</h4>
                    <button className="copy-button" onClick={copyToClipboard}>
                      <svg viewBox="0 0 24 24">
                        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                      </svg>
                      Copy Code
                    </button>
                  </div>
                  <div className="code-container">
                    <pre>
                      <code>
{`const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/${schema.collectionName}', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Schema
const ${schema.collectionName}Schema = new mongoose.Schema({
${Object.entries(schema.fields).map(([field, config]: [string, any]) => (
  `  ${field}: { type: ${config.type}${config.required ? ', required: true' : ''}${config.default ? `, default: ${config.default}` : ''} },\n`
)).join('')}});

// Create Model
const ${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)} = mongoose.model(
  '${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)}', 
  ${schema.collectionName}Schema
);

module.exports = ${schema.collectionName[0].toUpperCase() + schema.collectionName.slice(1)};`}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="action-button primary">
                <svg viewBox="0 0 24 24">
                  <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                </svg>
                Export All Files
              </button>
              <button className="action-button secondary">
                <svg viewBox="0 0 24 24">
                  <path d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C21,6.9 22,9.25 22,12V13.45C22,14.45 21.65,15.3 21,16C20.3,16.67 19.5,17 18.5,17C17.3,17 16.31,16.5 15.56,15.5C14.56,16.5 13.38,17 12,17C10.63,17 9.45,16.5 8.46,15.54C7.5,14.55 7,13.38 7,12C7,10.63 7.5,9.45 8.46,8.46C9.45,7.5 10.63,7 12,7C13.38,7 14.55,7.5 15.54,8.46C16.5,9.45 17,10.63 17,12V13.45C17,13.86 17.16,14.22 17.46,14.53C17.77,14.84 18.13,15 18.5,15C18.88,15 19.24,14.84 19.54,14.53C19.84,14.22 20,13.86 20,13.45V12C20,9.81 19.23,7.93 17.65,6.35C16.07,4.77 14.19,4 12,4C9.81,4 7.93,4.77 6.35,6.35C4.77,7.93 4,9.81 4,12C4,14.19 4.77,16.07 6.35,17.65C7.93,19.23 9.81,20 12,20H17V22H12C9.25,22 6.9,21 4.95,19.05C3,17.1 2,14.75 2,12C2,9.25 3,6.9 4.95,4.95C6.9,3 9.25,2 12,2Z" />
                </svg>
                Deploy to MongoDB Atlas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryDemo;
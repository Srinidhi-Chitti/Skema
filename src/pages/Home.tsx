import React, { useEffect, useState } from 'react';
import FloatingNavbar from '../components/FloatingNavbar';
import './Home.css';
import './TryDemo'; // This will stay, but navigation happens via router!
import { useNavigate } from 'react-router-dom'; // needed to navigate to /try-demo

const Home = () => {
  const navigate = useNavigate();
  const [schemaText, setSchemaText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const schemaLines = [
    "// Analyzing dataset...",
    "// Detected 5 fields in CSV",
    "// Inferring data types...",
    "// Generated MongoDB schema:",
    "",
    "const userSchema = new mongoose.Schema({",
    "  name: { type: String, required: true },",
    "  email: { type: String, required: true, unique: true },",
    "  age: { type: Number, min: 18 },",
    "  createdAt: { type: Date, default: Date.now },",
    "  isActive: { type: Boolean, default: true }",
    "});",
    "",
    "// Schema validation rules added",
    "// Ready to deploy!"
  ];

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      if (currentLine < schemaLines.length) {
        setSchemaText(prev => prev + (prev ? '\n' : '') + schemaLines[currentLine]);
        setCurrentLine(currentLine + 1);
      } else {
        setIsAnimating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentLine, isAnimating]);

  return (
    <div className="container">
      <div className="animated-bg">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <FloatingNavbar />
      
      <div className="content-wrapper">
        <div className="header">
          <h1 className="logo">Skema</h1>
        </div>
        
        <div className="main-content">
          <h2>Transform datasets into MongoDB schemas with AI-powered analysis</h2>
          <div className="buttons">
            <button className="play-button" onClick={() => navigate('/try-demo')}>
              Try Demo
            </button>
            <button className="docs-button">Documentation</button>
          </div>
        </div>
        
        <div className="schema-visualization">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="close"></span>
              <span className="minimize"></span>
              <span className="expand"></span>
            </div>
            <div className="terminal-title">dataset-to-schema.js</div>
          </div>
          <div className="code-example">
            <pre>{schemaText}<span className="cursor">|</span></pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

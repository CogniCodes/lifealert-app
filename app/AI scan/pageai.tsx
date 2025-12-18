"use client";

import * as tf from "@tensorflow/tfjs";
import * as tflite from "@tensorflow/tfjs-tflite";
import { useState, useEffect, useRef } from "react";

// IMPORTANT: This path must match where you put your model file
const MODEL_PATH = "/assets/model/model_unquant.tflite";

// OPTIONAL: Update these labels to match your specific model (e.g., Healthy, Pneumonia, etc.)
const CLASSES = ["Class 1", "Class 2", "Class 3"]; 

export default function AIAnalysisPage() {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<{ label: string; confidence: number }[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  // 1. Load the Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Loading model...");
        tflite.setWasmPath("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite/dist/");
        const loadedModel = await tflite.loadTFLiteModel(MODEL_PATH);
        setModel(loadedModel);
        setLoading(false);
        console.log("Model loaded successfully");
      } catch (error) {
        console.error("Failed to load model:", error);
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  // 2. Handle Image Upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      setPredictions([]); 
    }
  };

  // 3. Run AI Prediction
  const runPrediction = async () => {
    if (!model || !imageRef.current) return;

    // Convert image to tensor
    const tfImg = tf.browser.fromPixels(imageRef.current);
    const resized = tf.image.resizeBilinear(tfImg, [224, 224]);
    const expanded = resized.expandDims(0).toFloat().div(tf.scalar(255));

    // Predict
    const outputTensor = model.predict(expanded) as tf.Tensor;
    const values = await outputTensor.data();

    // Format results
    const results = Array.from(values).map((value, index) => ({
      label: CLASSES[index] || `Class ${index + 1}`,
      confidence: value as number,
    }));

    results.sort((a, b) => b.confidence - a.confidence);
    setPredictions(results);
    
    // Cleanup
    tfImg.dispose(); resized.dispose(); expanded.dispose(); outputTensor.dispose();
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-dark-300 p-10 text-white">
      <h1 className="mb-6 text-3xl font-bold text-green-500">AI Diagnostic Scan</h1>
      
      <div className="flex flex-col items-center gap-6 rounded-lg bg-dark-400 p-8 shadow-lg w-full max-w-md">
        {/* Upload Button */}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
          className="block w-full cursor-pointer text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-green-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-green-600"
        />

        {/* Image Preview */}
        {imageURL && (
          <div className="relative">
            <img 
              ref={imageRef} 
              src={imageURL} 
              alt="Preview" 
              className="max-h-64 rounded-lg border border-gray-600" 
              crossOrigin="anonymous" 
            />
          </div>
        )}

        {/* Analyze Button */}
        {imageURL && (
          <button
            onClick={runPrediction}
            disabled={!model}
            className={`w-full rounded px-6 py-3 font-bold transition-colors ${
               !model ? "bg-gray-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "Loading Model..." : "Run Analysis"}
          </button>
        )}

        {/* Results */}
        {predictions.length > 0 && (
          <div className="w-full space-y-2">
            <h3 className="text-xl font-semibold">Results:</h3>
            {predictions.map((p, i) => (
              <div key={i} className="flex justify-between rounded bg-dark-500 p-3">
                <span>{p.label}</span>
                <span className="font-bold text-green-400">{(p.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

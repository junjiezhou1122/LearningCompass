import React, { useState } from "react";
import { useParams, useLocation } from "wouter";

const TestCourseDetailPage = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiResponse(null);

      console.log(`Test fetching course with ID: ${id}`);
      const response = await fetch(`/api/courses/${id}`);

      // Get the raw text first for debugging
      const rawText = await response.clone().text();
      console.log("Raw API response:", rawText);

      if (!response.ok) {
        throw new Error(
          `API returned status ${response.status}: ${response.statusText}`
        );
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(rawText);
        setApiResponse(data);
      } catch (jsonError) {
        throw new Error(
          `Failed to parse API response as JSON: ${jsonError.message}`
        );
      }
    } catch (err) {
      console.error("Error in test fetch:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#0066cc", marginBottom: "1rem" }}>
        Test Course Detail Page
      </h1>

      <div
        style={{
          background: "#f0f8ff",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          border: "1px solid #cce5ff",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          Request Info
        </h2>
        <div>
          <strong>Course ID:</strong> {id} (type: {typeof id})
        </div>
        <div>
          <strong>Path:</strong> {window.location.pathname}
        </div>
        <div>
          <strong>API Endpoint:</strong> /api/courses/{id}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={testFetch}
          disabled={loading}
          style={{
            background: "#0066cc",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Testing..." : "Test API Fetch"}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", margin: "1rem 0" }}>Loading...</div>
      )}

      {error && (
        <div
          style={{
            background: "#fff5f5",
            color: "#e53e3e",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            border: "1px solid #fed7d7",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Error</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      )}

      {apiResponse && (
        <div
          style={{
            background: "#f0fff4",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            border: "1px solid #c6f6d5",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#38a169" }}>
            API Response
          </h3>
          <pre
            style={{
              background: "#2d3748",
              color: "#e2e8f0",
              padding: "1rem",
              borderRadius: "0.25rem",
              overflow: "auto",
              maxHeight: "400px",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <a
          href="/learning-center"
          style={{
            color: "#0066cc",
            textDecoration: "underline",
            marginRight: "1rem",
          }}
        >
          Back to Learning Center
        </a>
        <button
          onClick={() => navigate(`/course/${id}`)}
          style={{
            background: "#f97316",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Regular Course Page
        </button>
      </div>
    </div>
  );
};

export default TestCourseDetailPage;

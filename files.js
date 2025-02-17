/** @satisfies {import('@webcontainer/api').FileSystemTree} */
export const files = {
  "index.js": {
    file: {
      contents: `
import express from "express";

const app = express();
const port = 3111;

app.use(express.json());

// Serve frontend UI
app.get("/", (req, res) => {
  res.send(\`
    <h2>🔍 Live Regex Tester</h2>
    <p>Test regular expressions inside WebContainers.</p>

    <label>Regex:</label>
    <input type="text" id="regexInput" placeholder="Enter regex (e.g., \\d+)" />
    
    <label>Test String:</label>
    <textarea id="testString" rows="4" cols="50" placeholder="Enter test string"></textarea>
    
    <button onclick="testRegex()">Test Regex</button>
    <pre id="output"></pre>

    <script>
      function testRegex() {
        const regex = document.getElementById("regexInput").value;
        const testString = document.getElementById("testString").value;
        
        fetch("http://localhost:3111/test-regex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regex, testString })
        })
        .then(response => response.json())
        .then(data => document.getElementById("output").innerText = data.result)
        .catch(err => console.error("Error:", err));
      }
    </script>
  \`);
});

// API to test regex
app.post("/test-regex", (req, res) => {
  const { regex, testString } = req.body;

  try {
    const pattern = new RegExp(regex, "g");
    const matches = testString.match(pattern);
    res.json({ result: matches ? matches.join("\\n") : "No matches found" });
  } catch (error) {
    res.json({ result: \`Error: \${error.message}\` });
  }
});

app.listen(port, () => {
  console.log(\`🚀 Live Regex Tester running at http://localhost:\${port}\`);
});
      `,
    },
  },
  "package.json": {
    file: {
      contents: `
{
  "name": "regex-tester",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon index.js"
  }
}`
    },
  },
};

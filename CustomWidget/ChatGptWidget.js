(function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      div { margin: 50px auto; max-width: 600px; }
      .input-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      #prompt-input, #generate-button { padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; }
      #prompt-input { width: 60%; }
      #attachment-button { padding: 10px; font-size: 16px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; margin-right: 10px; }
      #generate-button { background-color: #000; color: #fff; cursor: pointer; width: 25%; }
      #response-container { margin-top: 20px; }
      canvas, img { max-width: 100%; }
    </style>
    <div>
      <center>
        <img src="https://1000logos.net/wp-content/uploads/2023/02/ChatGPT-Logo.jpg" width="200"/>
        <h1>ChatGPT</h1>
      </center>
      <div class="input-container">
        <button id="attachment-button">📎</button>
        <input type="text" id="prompt-input" placeholder="Message GPT">
        <button id="generate-button">Search</button>
      </div>
      <div id="response-container"></div>
    </div>
  `;

  class Widget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
      this._props = {};
    }

    connectedCallback() {
      this.initMain();
    }

    async initMain() {
      const responseContainer = this.shadowRoot.getElementById("response-container");
      responseContainer.innerHTML = "";
      const { apiKey } = this._props;

      // Event listener for the attachment button
      this.shadowRoot.getElementById("attachment-button").addEventListener("click", () => {
        alert("Attachment button clicked. Implement upload functionality here.");
      });

      this.shadowRoot.getElementById("generate-button").addEventListener("click", async () => {
        const prompt = this.shadowRoot.getElementById("prompt-input").value;
        responseContainer.innerHTML = `<p>Loading...</p>`;

        // Determine if the request is for an image or text
        const isImageRequest = /image|graphic|visual/i.test(prompt);

        if (isImageRequest) {
          // Use DALL·E for image generation
          const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              prompt,
              n: 1,
              size: "512x512",
            }),
          });

          if (imageResponse.ok) {
            const { data } = await imageResponse.json();
            responseContainer.innerHTML = "";
            const img = document.createElement("img");
            img.src = data[0].url;
            responseContainer.appendChild(img);
          } else {
            const error = await imageResponse.json();
            alert("DALL·E Response: " + error.error.message);
            responseContainer.innerHTML = "";
          }
        } else {
          // Use GPT for text completion
          const textResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
              ],
              max_tokens: 1024,
              temperature: 0.5,
            }),
          });

          if (textResponse.ok) {
            const { choices } = await textResponse.json();
            const result = choices[0].message.content.trim();

            // Clear previous response
            responseContainer.innerHTML = "";

            try {
              const parsedData = JSON.parse(result); // Assume structured data is JSON
              if (Array.isArray(parsedData.data)) {
                this.renderChart(responseContainer, parsedData);
              } else {
                this.renderText(responseContainer, result);
              }
            } catch (e) {
              this.renderText(responseContainer, result); // Fallback to text if not JSON
            }
          } else {
            const error = await textResponse.json();
            alert("OpenAI Response: " + error.error.message);
            responseContainer.innerHTML = "";
          }
        }
      });
    }

    renderChart(container, data) {
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);

      // Create a chart using Chart.js
      new Chart(canvas, {
        type: "bar",
        data: {
          labels: data.labels, // Array of labels
          datasets: [
            {
              label: data.title || "Dataset",
              data: data.data, // Array of data points
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: data.title || "Generated Chart",
            },
          },
        },
      });
    }

    renderText(container, text) {
      const textArea = document.createElement("textarea");
      textArea.rows = "10";
      textArea.cols = "50";
      textArea.readOnly = true;
      textArea.value = text;
      container.appendChild(textArea);
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate() {
      this.initMain();
    }
  }

  customElements.define("com-sap-chatgptwidget", Widget);
})();

# From Data to Insight: Interactive Visualization of Diabetes Risk Factors

## DESCRIPTION
This package presents an interactive diabetes risk exploration system titled “From Data to Insight: Interactive Visualization of Diabetes Risk Factors.” It combines an interpretable logistic regression model with a browser-based D3.js dashboard to help users understand how health, lifestyle, and demographic factors relate to diabetes outcomes.

The system uses the CDC BRFSS 2015 Health Indicators dataset and focuses on interpretability and real-time interaction rather than black-box prediction. Users can enter a health profile and instantly receive an estimated diabetes risk probability, a qualitative risk level, and personalized recommendations.

The dashboard is implemented entirely on the client side using HTML, CSS, JavaScript, and D3.js. Feature engineering, scaling, and logistic regression prediction are reproduced in JavaScript, allowing instant updates in the browser without requiring a backend server.

The full BRFSS dataset is not included in this package due to its size. Instead, the `data/` folder contains processed JSON files required for the demo, including model metadata, validation cases, and cohort summary information.

The file `predictor_reference.py` is provided as a reference implementation to validate that the JavaScript prediction pipeline is consistent with the original Python model.

D3.js is loaded via CDN, so an internet connection is required when running the dashboard.

---

## INSTALLATION
1. Download or copy the project folder to your local machine.

2. Ensure the folder contains the following files:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `predictor_reference.py`
   - `data/`

3. Inside the `data/` folder, ensure the following files are included:
   - `model_meta.json`
   - `validation_cases.json`
   - `cohort_summary.json`

4. No additional package installation is required. The dashboard runs in a web browser using HTML, CSS, JavaScript, and D3.js.

5. A modern browser such as Chrome, Safari, Firefox, or Edge is recommended.

6. To avoid browser restrictions when loading local JSON files, run the project using a local web server.

---

## EXECUTION
To run a demo:

1. Open Terminal or Command Prompt and navigate to the project folder.

2. Start a local web server. For example, using Python:
   ```bash
   python3 -m http.server 8000

Open a browser and go to:

http://localhost:8000/index.html
Use the form inputs to enter or adjust a user health profile.
The dashboard will automatically update the predicted probability, risk category, and recommendations in real time.

The interface supports interactive “what-if” exploration through dynamic visual feedback.

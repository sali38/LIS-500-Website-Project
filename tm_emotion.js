// tm_emotion.js

// Teachable Machine model URL (Samira가 만든 모델)
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Bn6RjZdcH/";

let model = null;
let running = false;
let stream = null;

const webcamElement   = document.getElementById("webcam");
const labelElement    = document.getElementById("predictionLabel");
const startButton     = document.getElementById("startButton");
const stopButton      = document.getElementById("stopButton");

// 버튼에 이벤트 연결
startButton.addEventListener("click", startDemo);
stopButton.addEventListener("click", stopDemo);

// Teachable Machine 모델 로드
async function loadModel() {
  if (model) return;

  const modelURL    = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";

  labelElement.textContent = "loading model…";
  model = await tmImage.load(modelURL, metadataURL);
}

// 웹캠 + 모델 시작
async function startDemo() {
  if (running) return;
  await loadModel();

  try {
    labelElement.textContent = "starting webcam…";

    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    webcamElement.srcObject = stream;
    await webcamElement.play();

    running = true;
    window.requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    labelElement.textContent = "could not access webcam (check permissions)";
  }
}

// 웹캠 + 루프 중단
function stopDemo() {
  running = false;

  if (webcamElement) {
    webcamElement.pause();
    webcamElement.srcObject = null;
  }

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  labelElement.textContent = "stopped";
}

// 매 프레임마다 호출
async function loop() {
  if (!running) return;

  await predict();
  window.requestAnimationFrame(loop);
}

// 현재 프레임 감정 예측
async function predict() {
  if (!model) return;

  // readyState 4 = HAVE_ENOUGH_DATA
  if (webcamElement.readyState !== 4) return;

  const predictions = await model.predict(webcamElement);
  let bestClass = "";
  let bestProb  = 0;

  predictions.forEach(p => {
    if (p.probability > bestProb) {
      bestProb  = p.probability;
      bestClass = p.className; // TM에서 정의한 클래스 이름 (e.g., "Happy")
    }
  });

  if (bestClass) {
    labelElement.textContent =
      `${bestClass} (${(bestProb * 100).toFixed(1)}%)`;
  }
}

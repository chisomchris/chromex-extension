/**
 * Enables dragging of elements
 * @param {HTMLElement} elmnt - The element to be dragged
 */
const dragElement = (elmnt: HTMLElement) => {
  var posX = 0,
    posY = 0,
    mouseX = 0,
    mouseY = 0;

  elmnt.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e: MouseEvent) {
    e.preventDefault();
    mouseX = e.clientX;
    mouseY = e.clientY;
    window.addEventListener("mousemove", elementDrag);
    window.addEventListener("mouseup", closeDragElement);
  }

  function elementDrag(e: MouseEvent) {
    e.preventDefault();
    posX = mouseX - e.clientX;
    posY = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    elmnt.style.top = elmnt.offsetTop - posY + "px";
    elmnt.style.left = elmnt.offsetLeft - posX + "px";
  }

  function closeDragElement() {
    window.removeEventListener("mousemove", elementDrag, false);
    window.removeEventListener("mouseup", closeDragElement, false);
  }
};

const webCamDisplay = (condition: boolean, element: HTMLDivElement) => {
  if (condition) {
    element.children[1].classList.contains("hide-camera-feed") &&
      element.children[1].classList.remove("hide-camera-feed");
  } else {
    !element.children[1].classList.contains("hide-camera-feed") &&
      element.children[1].classList.add("hide-camera-feed");
  }
};

export function initControls(
  recorder: MediaRecorder,
  {
    webcam,
    camera,
    microphone,
    mic_stream,
  }: {
    webcam: MediaStream | undefined;
    mic_stream: MediaStream | undefined;
    camera: boolean;
    microphone: boolean;
  }
) {
  if (!document.querySelector("#helpmeout_recorder_controls")) {
    const div = document.createElement("div");
    div.setAttribute(
      "style",
      `
      position: fixed;
      bottom: 16px;
      left: 0%;
      z-index: 50;
      background-color: transparent;
      padding-left: 36px;
      display: flex;
      align-items: center;
      height: 7rem;
    `
    );
    div.setAttribute("class", "hide_camera_feed");
    div.setAttribute("id", "helpmeout_recorder_controls");
    div.innerHTML = `<div
    style="
      border: 4px solid #9a9a9a;
      background-color: #141414;
      height: 4.25rem;
      width: 26rem;
      display: flex;
      grid-column: span 8 / span 8;
      border-radius: 500px;
      padding: 8px 20px 8px 24px;
      cursor: move;
    "
  >
    <div
      style="
        height: 36px;
        width: 7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 2px solid white;
      "
    >
      <p
        style="
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: white;
          font-weight: 500;
        "
        id="timer"
      >
        00:00:00
      </p>
      <div
        style="
          position: relative;
          height: 20px;
          width: 20px;
          margin-left: 16px;
        "
      >
        <div
          id="indicator"
          class="animate-pulse"
          style="
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 100px;
            z-index: 50;
            top: 50%;
            left: 50%;
            background-color: #c00404;
            transform: translate(-50%, -50%);
          "
        >
          <style>
            @keyframes pulse {
              50% {
                opacity: 0.35;
              }
            }
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          </style>
        </div>
      </div>
    </div>
    <!-- controls -->
    <div
      style="
        display: flex;
        gap: 4px;
        margin-left: 12px;
        align-items: center;
        flex-direction: column;
      "
    >
      <button
        id="pause"
        style="
          margin: 0%;
          padding: 0%;
          width: 32px;
          background-color: white;
          height: 32px;
          border-radius: 100px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        "
      >
        <img alt="" style="width: 16px; height: 16px"
        src="${chrome.runtime.getURL("/assets/pause.png")}" />
      </button>
      <p
        style="
          margin-top: 0%;
          color: white;
          font-size: 12px;
          line-height: 1;
        "
      >
        Pause
      </p>
    </div>
    <div
      style="
        display: flex;
        gap: 4px;
        margin-left: 12px;
        align-items: center;
        flex-direction: column;
      "
    >
      <button
        id="stop"
        style="
          margin: 0%;
          padding: 0%;
          width: 32px;
          background-color: white;
          height: 32px;
          border-radius: 100px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        "
      >
        <img alt="" style="width: 16px"
        src="${chrome.runtime.getURL("/assets/stop.png")}" />
      </button>
      <p
        style="
          margin-top: 0%;
          color: white;
          font-size: 12px;
          line-height: 1;
        "
      >
        Stop
      </p>
    </div>
    <div
      style="
        display: flex;
        gap: 4px;
        margin-left: 12px;
        align-items: center;
        flex-direction: column;
      "
    >
      <button
        id="camera"
        style="
          margin: 0%;
          padding: 0%;
          width: 32px;
          background-color: white;
          height: 32px;
          border-radius: 100px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        "
      >
        <img alt="" style="width: 16px"
        src="${chrome.runtime.getURL("/assets/camera.png")}" />
      </button>
      <p
        style="
          margin-top: 0%;
          color: white;
          font-size: 12px;
          line-height: 1;
        "
      >
        Camera
      </p>
    </div>
    <div
      style="
        display: flex;
        gap: 4px;
        margin-left: 12px;
        align-items: center;
        flex-direction: column;
      "
    >
      <button
        id="microphone"
        style="
          margin: 0%;
          padding: 0%;
          width: 32px;
          background-color: white;
          height: 32px;
          border-radius: 100px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        "
      >
        <img alt="" style="width: 16px"
        src="${chrome.runtime.getURL("/assets/microphone.png")}" />
      </button>
      <p
        style="
          margin-top: 0%;
          color: white;
          font-size: 12px;
          line-height: 1;
        "
      >
        Mic
      </p>
    </div>

    <button
      id="delete"
      style="
        height: 32px;
        width: 32px;
        border-radius: 100px;
        display: grid;
        margin-left: 20px;
        place-items: center;
        background-color: #4b4b4b;
        cursor: pointer;
      "
    >
      <img src="${chrome.runtime.getURL("/assets/trash.png")}" alt=""
      style="width: 16px" />
    </button>
  </div>
  <div
    style="
      overflow: hidden;
      background-color: #efefef;
      width: 7rem;
      aspect-ratio: 1/1;
      border-radius: 100px;
      margin-left: 24px;
      border: 2px solid #b6b6b6;
      grid-column: span 3 / span 3;
      cursor: move;
    "
  >
    <style>
      .hide-camera-feed {
        display: none;
      }
    </style>
    <video
      id="video"
      muted
      autoplay
      style="
        height: 100%;
        width: 100%;
        border-radius: 500px;
        transform: scale(1.4) scale(-1,1);
        aspect-ratio: 1/1;
      "
    ></video>
  </div>`;

    const counter = (elem: HTMLElement, interval = 1000) => {
      var count = 0;
      var intervalID: number | undefined = undefined;

      function formatDuration(duration: number) {
        if (typeof duration !== "number" || duration < 0) return;
        const dd = (d: number) => (d.toString().length == 2 ? d : `0${d}`);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration - hours * 3600) / 60);
        const seconds = duration - hours * 3600 - minutes * 60;
        return `${dd(hours)}:${dd(minutes)}:${dd(seconds)}`;
      }
      function updateCounter(elnmt: HTMLElement, text: string) {
        elnmt.textContent = text;
      }
      function stop() {
        window.clearInterval(intervalID);
        intervalID = undefined;
      }
      function start() {
        if (!intervalID) {
          intervalID = window.setInterval(() => {
            count++;
            updateCounter(elem, formatDuration(count) || "");
          }, interval);
        }
      }
      function reset() {
        count = 0;
      }
      return {
        start,
        stop,
        reset,
      };
    };

    const videoElem: HTMLVideoElement = div.querySelector("#video")!;
    const pauseBtn = div.querySelector("#pause");
    const stopBtn = div.querySelector("#stop");
    const cameraBtn = div.querySelector("#camera");
    const microphoneBtn = div.querySelector("#microphone");
    const timerDiv: HTMLElement = div.querySelector("#timer")!;
    const indicator: HTMLDivElement = div.querySelector("#indicator")!;
    const styleList = [
      "before:absolute",
      "before:w-[2px]",
      "before:bg-[#646464]",
      "before:h-6",
      "before:rotate-45",
    ];
    const timer = counter(timerDiv, 1000);

    if (webcam) {
      webcam.getVideoTracks()[0].enabled = camera;
      videoElem.srcObject = webcam;
      webCamDisplay(
        webcam instanceof MediaStream && webcam.getVideoTracks()[0].enabled,
        div
      );
    }
    if (mic_stream) {
      mic_stream.getAudioTracks()[0].enabled = microphone;
    } else {
      styleList.forEach(
        (style) =>
          !microphoneBtn?.classList.contains(style) &&
          microphoneBtn?.classList.add(style)
      );
    }

    !camera && styleList.forEach((style) => cameraBtn?.classList.add(style));

    !microphone &&
      styleList.forEach((style) => microphoneBtn?.classList.add(style));

    const pausePlay = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const img = btn.children[0] as HTMLImageElement;
      if (recorder.state === "recording") {
        recorder.pause();
        timer.stop();
        img.src = chrome.runtime.getURL("assets/play.svg");
      } else {
        recorder.resume();
        timer.start();
        img.src = chrome.runtime.getURL("assets/pause.png");
      }
      if (recorder.state === "paused") {
        indicator.classList.contains("animate-pulse") &&
          indicator.classList.remove("animate-pulse");
      } else {
        !indicator.classList.contains("animate-pulse") &&
          indicator.classList.add("animate-pulse");
      }
    };

    const endRecording = () => {
      recorder.stop();
      timer.stop();
      document.body.removeChild(div);
    };

    const toggleCamera = () => {
      if (!webcam) return;
      webcam.getVideoTracks()[0].enabled = !webcam.getVideoTracks()[0].enabled;
      if (webcam.getVideoTracks()[0].enabled) {
        styleList.forEach(
          (style) =>
            cameraBtn?.classList.contains(style) &&
            cameraBtn?.classList.remove(style)
        );
      } else if (!webcam.getVideoTracks()[0].enabled) {
        styleList.forEach(
          (style) =>
            !cameraBtn?.classList.contains(style) &&
            cameraBtn?.classList.add(style)
        );
      }
      webCamDisplay(webcam.getVideoTracks()[0].enabled, div);
    };

    const toggleMicrophone = () => {
      if (!mic_stream) return;
      mic_stream.getAudioTracks()[0].enabled =
        !mic_stream.getAudioTracks()[0].enabled;
      if (mic_stream.getAudioTracks()[0].enabled) {
        styleList.forEach(
          (style) =>
            microphoneBtn?.classList.contains(style) &&
            microphoneBtn?.classList.remove(style)
        );
      } else if (!mic_stream.getAudioTracks()[0].enabled) {
        styleList.forEach(
          (style) =>
            !microphoneBtn?.classList.contains(style) &&
            microphoneBtn?.classList.add(style)
        );
      }
    };

    stopBtn instanceof HTMLButtonElement &&
      stopBtn.addEventListener("click", endRecording);

    pauseBtn instanceof HTMLButtonElement &&
      pauseBtn.addEventListener("click", pausePlay);

    microphoneBtn instanceof HTMLButtonElement &&
      microphoneBtn.addEventListener("click", toggleMicrophone);

    cameraBtn instanceof HTMLButtonElement &&
      cameraBtn.addEventListener("click", toggleCamera);

    /**
     * Enables dragging of controls UI
     */
    dragElement(div);
    timer.start();
    document.body.appendChild(div);
  }
}

/**
 *
 * @param {string} type - The type of input device
 * @param devices - The list of devices accessible to the browser
 * @returns {boolean}
 */
async function hasInputType(
  type: "audioinput" | "videoinput",
  devices?: MediaDeviceInfo[]
): Promise<boolean> {
  let _ = devices;
  if (!_) _ = await navigator.mediaDevices.enumerateDevices();

  return _.some((device) => device.kind === type);
}

export async function getWebCamera() {
  const hasCam = await hasInputType("videoinput");

  return hasCam
    ? await navigator.mediaDevices.getUserMedia({ video: true })
    : undefined;
}
// interface Chi extends MediaTrackConstraintSet {}
export async function getMicrophone() {
  const hasSpeaker = await hasInputType("audioinput");
  return hasSpeaker
    ? await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleSize: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
    : undefined;
}

export function progressHanler(start = 0, max = 100) {
  let val = start;
  const ui = document.createElement("div");
  ui.setAttribute(
    "style",
    `width:100px;
    height:100px;
    border-radius:1000px;
    padding:6px;background: conic-gradient(#333 0%, transparent 0%);
    position:fixed;
    z-index:100;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    -webkit-transform:translate(-50%,-50%);
    -moz-transform:translate(-50%,-50%);`
  );
  ui.innerHTML = `<div
        style="
        background-color: white;
        height: 100%;
        width: 100%;
        border-radius: 100px;
        display: grid;
        place-items: center;
      "><p style="font-size: 1.75rem;font-weight:bold">${val}%</p></div>`;

  function update(value: number) {
    if (value >= max) {
      setTimeout(() => removeFromDOM(), 100);
      val = max;
    } else val = value;
    const angle = Math.round((val / max) * 100);
    ui.style.background = `conic-gradient(#333 ${angle}%, #3333 ${angle}%)`;
    ui.children[0].children[0].textContent = `${angle}%`;
  }
  function removeFromDOM() {
    document.body.removeChild(ui);
  }
  return { ui, update };
}

interface MediaTrackConstraints {
  mandatory?: {
    chromeMediaSource: string;
    chromeMediaSourceId: string;
  };
}

interface DisplayMediaStreamOptions {
  selfBrowserSurface?: "include" | "exclude";
}


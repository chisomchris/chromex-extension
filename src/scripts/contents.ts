import fixWebmDuration from "webm-duration-fix";
import { uploadFile } from "./upload";
import { getMicrophone, getWebCamera, initControls } from "./utils";

type Message = {
  isCurrentTab: boolean;
  camera: boolean;
  microphone: boolean;
  streamId?: string;
};

function main() {
  let tracks: MediaStreamTrack[] = [];

  /**
   * Get streams for Screen recording and Webcam
   * @param { string | undefined } streamId - stream ID for tab capture
   * @returns { MediaStream }
   * @returns { MediaStream }
   */
  const getStream = async (streamId?: string) => {
    try {
      let media: MediaStream | undefined;
      let mic: MediaStream | undefined;
      let webcam: MediaStream | undefined;
      if (streamId) {
        const config: MediaStreamConstraints = {
          video: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId,
            },
          },
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId,
            },
          },
        };
        const screen_and_speaker_stream =
          await navigator.mediaDevices.getUserMedia(config);
        const cam_stream = await getWebCamera();
        if (cam_stream) {
          tracks = [...tracks, ...cam_stream.getTracks()];
        }
        const mic_stream = await getMicrophone();
        const audioCtx = new AudioContext();
        const destination = audioCtx.createMediaStreamDestination();
        if (mic_stream) {
          const source1 = audioCtx.createMediaStreamSource(mic_stream);
          source1.connect(destination);
          mic = mic_stream;
          tracks = [...tracks, ...mic_stream.getTracks()];
        }
        const speaker_audio_track =
          screen_and_speaker_stream.getAudioTracks()[0];
        if (speaker_audio_track) {
          screen_and_speaker_stream.removeTrack(speaker_audio_track);
          tracks.push(speaker_audio_track);
          const source2 = audioCtx.createMediaStreamSource(
            new MediaStream([speaker_audio_track])
          );
          source2.connect(destination);
        }
        const mixedAudio = destination.stream;
        media = new MediaStream([
          ...screen_and_speaker_stream.getVideoTracks(),
        ]);
        media.addTrack(mixedAudio.getAudioTracks()[0]);
        webcam = cam_stream;
        tracks = [
          ...tracks,
          ...screen_and_speaker_stream.getTracks(),
          ...mixedAudio.getTracks(),
        ];
      } else {
        const screen_and_speaker_stream =
          await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
            selfBrowserSurface: "include",
          });

        screen_and_speaker_stream.getTracks().forEach((track) => {
          track.onended = () => {
            stopTracks();
            const element = document.querySelector(
              "#helpmeout_recoreder_controls"
            );
            if (element instanceof HTMLDivElement) {
              document.body.removeChild(element);
            }
          };
        });

        const cam_stream = await getWebCamera();
        if (cam_stream) {
          tracks = [...tracks, ...cam_stream.getTracks()];
        }
        const mic_stream = await getMicrophone();
        const audioCtx = new AudioContext();
        const destination = audioCtx.createMediaStreamDestination();
        if (mic_stream) {
          const source1 = audioCtx.createMediaStreamSource(mic_stream);
          source1.connect(destination);
          tracks = [...tracks, ...mic_stream.getTracks()];
          mic = mic_stream;
        }

        const speaker_audio_track =
          screen_and_speaker_stream.getAudioTracks()[0];
        if (speaker_audio_track) {
          screen_and_speaker_stream.removeTrack(speaker_audio_track);
          tracks.push(speaker_audio_track);
          const source2 = audioCtx.createMediaStreamSource(
            new MediaStream([speaker_audio_track])
          );
          source2.connect(destination);
        }
        const mixedAudio = destination.stream;
        media = new MediaStream([
          ...screen_and_speaker_stream.getVideoTracks(),
        ]);
        media.addTrack(mixedAudio.getAudioTracks()[0]);
        webcam = cam_stream;

        tracks = [
          ...tracks,
          ...screen_and_speaker_stream.getTracks(),
          ...mixedAudio.getTracks(),
        ];
      }
      return { media, webcam, mic };
    } catch (error) {
      console.error("Eroor:", error);
    }
  };

  /**
   * Creates MediaRecorder object
   * @param stream - Screen record stream
   * @param camera - specify if camera should be used
   * @param microphone - specify if microphone should be used
   * @param webcam - Webcam stream
   */
  const createRecorder = (
    stream: MediaStream,
    camera: boolean,
    microphone: boolean,
    webcam: MediaStream | undefined,
    mic_stream: MediaStream | undefined
  ) => {
    let recordedChuncks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        recordedChuncks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      stopTracks();
      try {
        const fixBlob = await fixWebmDuration(
          new Blob([...recordedChuncks], { type: "video/webm;codec=vp9" })
        );
        const video_id = await uploadFile(fixBlob);
        if (video_id && typeof video_id === "string") {
          window.open(
            `http://localhost:3000/videos/${video_id}`,

            "_blank"
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    /**
     * Start recorder
     */
    mediaRecorder.start(200);

    /**
     * Setup controls UI
     */
    initControls(mediaRecorder, { webcam, camera, microphone, mic_stream });
  };

  /**
   *  Starts recording of user screen
   * @param { boolean } camera - specify if camera should be captured or not
   * @param { boolean } microphone - specify if microphone should be captured or not
   * @param { string | undefined } streamId - specify stream ID for tab capture
   */
  const startRecording = async (
    camera: boolean,
    microphone: boolean,
    streamId?: string
  ) => {
    try {
      const streams = await getStream(streamId);
      if (streams && streams.media instanceof MediaStream) {
        createRecorder(
          streams.media,
          camera,
          microphone,
          streams.webcam,
          streams.mic
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Stops all active tracks
   */
  const stopTracks = () => {
    tracks.length && tracks.forEach((track) => track.stop());
    tracks = [];
  };

  /**
   * Listens for start_recording
   * starts recording when they is a start_recording message
   */
  chrome.runtime.onMessage.addListener((request) => {
    if (request.message.type === "start_recording") {
      const { isCurrentTab, camera, microphone, streamId }: Message =
        request.message;
      if (isCurrentTab && streamId) {
        startRecording(camera, microphone, streamId);
      } else {
        startRecording(camera, microphone);
      }
    }
  });
}

main();

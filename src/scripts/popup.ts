(() => {
  type RecordState = {
    currentTab: boolean;
    camera: boolean;
    audio: boolean;
  };

  const closeBtn = document.getElementById("close") as HTMLButtonElement;
  const recordBtn = document.getElementById(
    "startRecording"
  ) as HTMLButtonElement;
  const tabs: NodeListOf<HTMLButtonElement> =
    document.querySelectorAll("[data-tab]");
  const toggleBtns: NodeListOf<HTMLButtonElement> =
    document.querySelectorAll(".switch");

  let recordState: RecordState = {
    currentTab: true,
    camera: true,
    audio: true,
  };

  /** get saved user choices from previous recording */
  chrome.storage.local.get(["recordState"]).then((result) => {
    if (Object.keys(result).length === 3) recordState = result.recordState;
    recordState.currentTab
      ? tabs[1].classList.add("active")
      : tabs[0].classList.add("active");
    recordState.camera && toggleBtns[0].classList.add("active");
    recordState.audio && toggleBtns[1].classList.add("active");
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      if (tab.dataset.tab === "window") {
        recordState.currentTab = false;
      } else {
        recordState.currentTab = true;
      }
    });
  });

  /** Add click event listener for each toggle button */
  toggleBtns.forEach((toggleBtn) => {
    addListener(toggleBtn, toggleBtn.dataset["media"] as keyof RecordState);
  });

  /**
   * Adds click event listener to element.
   * @param {HTMLButtonElement} elem - HTML element to add event listener to.
   * @param {"audio" | "video"} key - The key for attribute to modify.
   */
  function addListener(elem: HTMLButtonElement, key: keyof RecordState) {
    elem.addEventListener("click", (e) => {
      e.currentTarget &&
        e.currentTarget instanceof HTMLButtonElement &&
        e.currentTarget.classList.toggle("active");
      recordState[key] = !recordState[key];
    });
  }

  /** Close popup */
  closeBtn.addEventListener("click", () => {
    window.close();
  });

  recordBtn.addEventListener("click", async () => {
    /** Get id for tab from which extension is opened*/
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (tab.id && typeof tab.id === "number") {
      /** Get mediastrem for tab capture to be used in content script */
      if (recordState.currentTab === true) {
        const tabId = tab.id;
        chrome.tabCapture.getMediaStreamId(
          { consumerTabId: tab.id },
          (streamId) => {
            /** Send signal to start recording along with video config */
            const message = {
              type: "start_recording",
              isCurrentTab: recordState.currentTab,
              camera: recordState.camera,
              microphone: recordState.audio,
              streamId,
            };
            chrome.tabs.sendMessage(tabId, { message });
          }
        );
      } else {
        /** Send signal to start recording along with video config */
        const message = {
          type: "start_recording",
          isCurrentTab: recordState.currentTab,
          camera: recordState.camera,
          microphone: recordState.audio,
        };
        chrome.tabs.sendMessage(tab.id, { message });
      }
      /** Save current config to storage */
      chrome.storage.local.set({ recordState });
      window.close();
    }
  });
})();
